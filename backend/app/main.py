from fastapi import FastAPI, Depends, HTTPException, Header, Request
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from passlib.context import CryptContext
from google.cloud import firestore

from app.firebase_config import get_db
from app.schemas import (
    ItemCreate, ItemUpdate, ItemResponse,
    SaleCreate, SaleResponse, SaleUpdate,
    DashboardStats, AIChatRequest, AIChatResponse,
    ShopCreate, ShopLogin, ShopResponse, ShopUpdate, ShopOwnerPinSetup,
    CustomerCreate, CustomerResponse, DebtRecordCreate, DebtRecordResponse,
    ShopProfileCreate, ShopProfileResponse
)
from app.ai_service import AIService

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Firebase Firestore initialized.")
    yield

app = FastAPI(
    title="Notable AI Shop Assistant (Firebase)",
    description="Smart multi-shop assistant powered by Firebase Firestore",
    version="3.0.0",
    lifespan=lifespan
)

# Password Hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# CORS middleware - must be registered first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global 500 handler — ensures CORS headers are always included in error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"message": "Notable AI Multi-Shop API (Firebase)"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}

# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=ShopResponse)
def register_shop(shop: ShopCreate, db: firestore.Client = Depends(get_db)):
    shops_ref = db.collection('shops')
    existing = shops_ref.where('name', '==', shop.name).limit(1).get()
    if len(existing) > 0:
        raise HTTPException(status_code=400, detail="Store name already registered")
    
    hashed_password = pwd_context.hash(shop.password)
    new_shop = {
        "name": shop.name,
        "password_hash": hashed_password,
        "pin_hash": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    doc_ref = shops_ref.add(new_shop)[1]
    return {
        "id": doc_ref.id,
        "name": shop.name,
        "created_at": new_shop["created_at"],
        "is_pin_set": False
    }

@app.post("/api/auth/login", response_model=ShopResponse)
def login_shop(login: ShopLogin, db: firestore.Client = Depends(get_db)):
    shops_ref = db.collection('shops')
    query = shops_ref.where('name', '==', login.name).limit(1).get()
    
    if len(query) == 0:
        raise HTTPException(status_code=401, detail="Invalid store name or password")
    
    doc = query[0]
    db_shop = doc.to_dict()
    
    if not pwd_context.verify(login.password, db_shop["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid store name or password")
    
    return {
        "id": doc.id,
        "name": db_shop["name"],
        "created_at": db_shop["created_at"],
        "is_pin_set": db_shop.get("pin_hash") is not None
    }

@app.post("/api/auth/verify-owner-pin")
def verify_owner_pin(setup: ShopOwnerPinSetup, x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection('shops').document(x_shop_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    db_shop = doc.to_dict()
    if not db_shop.get("pin_hash"):
        raise HTTPException(status_code=401, detail="PIN not set")
    
    if not pwd_context.verify(setup.pin, db_shop["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    return {"status": "success"}

# --- Profile Endpoints ---

@app.post("/api/profiles", response_model=ShopProfileResponse)
def create_profile(profile: ShopProfileCreate, x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    profiles_ref = db.collection('shop_profiles')
    existing = profiles_ref.where('shop_id', '==', x_shop_id).where('name', '==', profile.name).limit(1).get()
    if len(existing) > 0:
        raise HTTPException(status_code=400, detail="Profile name already exists")
    
    new_profile = {
        "name": profile.name,
        "shop_id": x_shop_id,
        "created_at": datetime.now(timezone.utc)
    }
    doc_ref = profiles_ref.add(new_profile)[1]
    return {**new_profile, "id": doc_ref.id}

@app.get("/api/profiles", response_model=List[ShopProfileResponse])
def get_profiles(x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    docs = db.collection('shop_profiles').where('shop_id', '==', x_shop_id).get()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

# --- Items Endpoints ---

@app.post("/api/items", response_model=ItemResponse)
def create_item(item: ItemCreate, x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    items_ref = db.collection('items')
    existing = items_ref.where('shop_id', '==', x_shop_id).where('name', '==', item.name).limit(1).get()
    if len(existing) > 0:
        raise HTTPException(status_code=400, detail="Item already exists in this shop")
    
    new_item = item.model_dump()
    new_item["shop_id"] = x_shop_id
    new_item["created_at"] = datetime.now(timezone.utc)
    doc_ref = items_ref.add(new_item)[1]
    return {**new_item, "id": doc_ref.id}

@app.get("/api/items", response_model=List[ItemResponse])
def get_items(x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    docs = db.collection('items').where('shop_id', '==', x_shop_id).get()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

@app.get("/api/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: str, x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    doc = db.collection('items').document(item_id).get()
    if not doc.exists or doc.to_dict().get("shop_id") != x_shop_id:
        raise HTTPException(status_code=404, detail="Item not found")
    return {**doc.to_dict(), "id": doc.id}

@app.put("/api/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: str, item_update: ItemUpdate, x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection('items').document(item_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("shop_id") != x_shop_id:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    doc_ref.update(update_data)
    
    return {**doc.to_dict(), **update_data, "id": doc.id}

@app.delete("/api/items/{item_id}")
def delete_item(item_id: str, x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection('items').document(item_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("shop_id") != x_shop_id:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # In Firestore, we manualy delete related or just let them be "orphaned"
    # For safety, let's delete sales related to this item in this shop
    sales = db.collection('sales').where('item_id', '==', item_id).get()
    for sale in sales:
        sale.reference.delete()
    
    doc_ref.delete()
    return {"message": "Item deleted successfully"}

# --- Sales Endpoints ---

@app.post("/api/sales", response_model=SaleResponse)
def create_sale(sale: SaleCreate, x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    items_ref = db.collection('items')
    query = items_ref.where('shop_id', '==', x_shop_id).where('name', '==', sale.item_name).limit(1).get()
    
    if len(query) == 0:
        # Create item if it doesn't exist
        new_item = {
            "name": sale.item_name,
            "shop_id": x_shop_id,
            "current_stock": 0,
            "low_stock_threshold": 2,
            "selling_price": sale.selling_price,
            "cost_price": 0,
            "created_at": datetime.now(timezone.utc)
        }
        item_doc_ref = items_ref.add(new_item)[1]
        item_id = item_doc_ref.id
        item_data = new_item
    else:
        item_doc = query[0]
        item_id = item_doc.id
        item_data = item_doc.to_dict()

    sale_date = sale.sale_date or datetime.now(timezone.utc)
    new_sale = {
        "item_id": item_id,
        "item_name": item_data["name"],
        "shop_id": x_shop_id,
        "quantity": sale.quantity,
        "selling_price": sale.selling_price,
        "sale_date": sale_date,
        "recorded_by": sale.recorded_by,
        "created_at": datetime.now(timezone.utc)
    }
    
    doc_ref = db.collection('sales').add(new_sale)[1]
    
    # Update stock
    new_stock = max(0, item_data.get("current_stock", 0) - sale.quantity)
    db.collection('items').document(item_id).update({"current_stock": new_stock})
    
    return {**new_sale, "id": doc_ref.id}

@app.get("/api/sales", response_model=List[SaleResponse])
def get_sales(x_shop_id: str = Header(...), start_date: datetime = None, end_date: datetime = None, limit: int = 100, db: firestore.Client = Depends(get_db)):
    query = db.collection('sales').where('shop_id', '==', x_shop_id).order_by('sale_date', direction=firestore.Query.DESCENDING)
    
    if start_date:
        query = query.where('sale_date', '>=', start_date)
    if end_date:
        query = query.where('sale_date', '<=', end_date)
        
    docs = query.limit(limit).get()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

# --- Customer & Debt Endpoints ---

@app.post("/api/customers", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    customers_ref = db.collection('customers')
    new_customer = customer.model_dump()
    new_customer["shop_id"] = x_shop_id
    new_customer["total_debt"] = 0.0
    new_customer["created_at"] = datetime.now(timezone.utc)
    doc_ref = customers_ref.add(new_customer)[1]
    return {**new_customer, "id": doc_ref.id}

@app.get("/api/customers", response_model=List[CustomerResponse])
def get_customers(x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    docs = db.collection('customers').where('shop_id', '==', x_shop_id).get()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

# --- Dashboard Stats ---

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(x_shop_id: str = Header(...), db: firestore.Client = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    try:
        sales_docs = db.collection('sales').where('shop_id', '==', x_shop_id).where('sale_date', '>=', month_start).get()
        items_docs = db.collection('items').where('shop_id', '==', x_shop_id).get()
        
        items_map = {doc.id: doc.to_dict() for doc in items_docs}
        sales = [doc.to_dict() for doc in sales_docs]
        
        def calc_profit(s_list):
            p = 0
            for s in s_list:
                item = items_map.get(s['item_id'], {})
                p += (s['selling_price'] - item.get('cost_price', 0)) * s['quantity']
            return p

        daily_sales = [s for s in sales if s['sale_date'] >= today_start]
        weekly_sales = [s for s in sales if s['sale_date'] >= week_start]
        
        low_stock = [ {**item, "id": id} for id, item in items_map.items() if item.get('current_stock', 0) <= item.get('low_stock_threshold', 2)]
        
        # Best selling (simple aggregation)
        best_selling_map = {}
        for s in sales:
            name = s['item_name']
            best_selling_map[name] = best_selling_map.get(name, 0) + s['quantity']
        
        best_selling_items = sorted([{"name": k, "quantity": v} for k, v in best_selling_map.items()], key=lambda x: x['quantity'], reverse=True)[:5]
        
        return DashboardStats(
            daily_profit=calc_profit(daily_sales),
            weekly_profit=calc_profit(weekly_sales),
            monthly_profit=calc_profit(sales),
            total_sales_today=sum(s['quantity'] for s in daily_sales),
            total_sales_week=sum(s['quantity'] for s in weekly_sales),
            total_sales_month=sum(s['quantity'] for s in sales),
            low_stock_items=low_stock,
            best_selling_items=best_selling_items,
            slow_moving_items=[] # Simplified
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat", response_model=AIChatResponse)
def ai_chat(request: AIChatRequest, db: firestore.Client = Depends(get_db)):
    ai_service = AIService(db)
    result = ai_service.chat(request.message, shop_id=request.shop_id)
    return AIChatResponse(**result)

# ... other AI endpoints similarly ...
