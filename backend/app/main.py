from fastapi import FastAPI, Depends, HTTPException, Header, Request
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from passlib.context import CryptContext

from app.database import get_db, engine
from app.models import Base, Shop, Item, Sale, Customer, DebtRecord, ShopProfile, StockHistory
from app.schemas import (
    ItemCreate, ItemUpdate, ItemResponse,
    SaleCreate, SaleResponse, SaleUpdate,
    DashboardStats, AIChatRequest, AIChatResponse, DeepInsight,
    ShopCreate, ShopLogin, ShopResponse, ShopUpdate, ShopOwnerPinSetup,
    CustomerCreate, CustomerResponse, DebtRecordCreate, DebtRecordResponse,
    ShopProfileCreate, ShopProfileResponse
)
from app.ai_service import AIService

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables ready.")
    except Exception as e:
        print(f"ERROR: Failed to initialize database: {e}")
    yield

app = FastAPI(
    title="Notable AI Shop Assistant",
    description="Smart multi-shop assistant",
    version="4.0.0",
    lifespan=lifespan
)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"message": "Notable AI Multi-Shop API v4 (Supabase)"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}

# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=ShopResponse)
def register_shop(shop: ShopCreate, db: Session = Depends(get_db)):
    existing = db.query(Shop).filter(Shop.name == shop.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Store name already registered")
    hashed_password = pwd_context.hash(shop.password)
    new_shop = Shop(name=shop.name, password_hash=hashed_password)
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    return {**new_shop.__dict__, "is_pin_set": new_shop.pin_hash is not None}

@app.post("/api/auth/login", response_model=ShopResponse)
def login_shop(login: ShopLogin, db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.name == login.name).first()
    if not shop or not pwd_context.verify(login.password, shop.password_hash):
        raise HTTPException(status_code=401, detail="Invalid name or password")
    return {**shop.__dict__, "is_pin_set": shop.pin_hash is not None}

@app.get("/api/auth/shop/{shop_id}", response_model=ShopResponse)
def get_shop(shop_id: int, db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {**shop.__dict__, "is_pin_set": shop.pin_hash is not None}

@app.put("/api/shops/settings", response_model=ShopResponse)
def update_shop(update: ShopUpdate, x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == x_shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    if update.name:
        shop.name = update.name
    if update.password:
        shop.password_hash = pwd_context.hash(update.password)
    if update.owner_pin:
        shop.pin_hash = pwd_context.hash(update.owner_pin)
    db.commit()
    db.refresh(shop)
    return {**shop.__dict__, "is_pin_set": shop.pin_hash is not None}

@app.post("/api/auth/set-owner-pin")
def set_owner_pin(pin_data: ShopOwnerPinSetup, x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == x_shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop.pin_hash = pwd_context.hash(pin_data.pin)
    db.commit()
    return {"message": "PIN set successfully"}

@app.post("/api/auth/verify-owner-pin")
def verify_pin(pin_data: ShopOwnerPinSetup, x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == x_shop_id).first()
    if not shop or not shop.pin_hash:
        raise HTTPException(status_code=404, detail="PIN not set")
    if not pwd_context.verify(pin_data.pin, shop.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    return {"message": "PIN verified"}

# --- Shop Profiles ---

@app.post("/api/profiles", response_model=ShopProfileResponse)
def create_profile(profile: ShopProfileCreate, x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    new_profile = ShopProfile(shop_id=x_shop_id, name=profile.name)
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@app.get("/api/profiles", response_model=List[ShopProfileResponse])
def list_profiles(x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    return db.query(ShopProfile).filter(ShopProfile.shop_id == x_shop_id).all()

# --- Items ---

@app.post("/api/items", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    existing = db.query(Item).filter(Item.shop_id == item.shop_id, Item.name == item.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item already exists in this shop")
    new_item = Item(**item.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.get("/api/items", response_model=List[ItemResponse])
def list_items(x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    return db.query(Item).filter(Item.shop_id == x_shop_id).all()

@app.get("/api/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.put("/api/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, update: ItemUpdate, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id, Item.shop_id == x_shop_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id, Item.shop_id == x_shop_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}

class BulkItemRow(BaseModel):
    name: str
    current_stock: int = 0
    low_stock_threshold: int = 2
    selling_price: float = 0.0
    cost_price: float = 0.0

class BulkImportRequest(BaseModel):
    shop_id: int
    items: List[BulkItemRow]

@app.post("/api/items/bulk-import")
def bulk_import_items(payload: BulkImportRequest, db: Session = Depends(get_db)):
    created = []
    skipped = []
    for row in payload.items:
        name = row.name.strip()
        if not name:
            continue
        existing = db.query(Item).filter(Item.shop_id == payload.shop_id, Item.name == name).first()
        if existing:
            skipped.append(name)
            continue
        new_item = Item(
            shop_id=payload.shop_id,
            name=name,
            current_stock=row.current_stock,
            low_stock_threshold=row.low_stock_threshold,
            selling_price=row.selling_price,
            cost_price=row.cost_price,
        )
        db.add(new_item)
        created.append(name)
    db.commit()
    return {
        "created": len(created),
        "skipped": len(skipped),
        "created_names": created,
        "skipped_names": skipped
    }

# --- Sales ---

@app.post("/api/sales", response_model=SaleResponse)
def record_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.shop_id == sale.shop_id, Item.name == sale.item_name).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Item '{sale.item_name}' not found")
    if item.current_stock < sale.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    item.current_stock -= sale.quantity
    item.updated_at = datetime.now(timezone.utc)
    sale_date = sale.sale_date or datetime.now(timezone.utc)
    new_sale = Sale(
        shop_id=sale.shop_id,
        item_id=item.id,
        quantity=sale.quantity,
        selling_price=sale.selling_price,
        sale_date=sale_date,
        recorded_by=sale.recorded_by
    )
    db.add(new_sale)
    db.add(StockHistory(shop_id=sale.shop_id, item_id=item.id, quantity_change=-sale.quantity, change_type='sale'))
    db.commit()
    db.refresh(new_sale)
    return {**new_sale.__dict__, "item_name": item.name}

@app.get("/api/sales", response_model=List[SaleResponse])
def list_sales(x_shop_id: int = Header(..., alias="X-Shop-Id"), limit: int = 50, db: Session = Depends(get_db)):
    sales = db.query(Sale).filter(Sale.shop_id == x_shop_id).order_by(Sale.sale_date.desc()).limit(limit).all()
    result = []
    for s in sales:
        item = db.query(Item).filter(Item.id == s.item_id).first()
        result.append({**s.__dict__, "item_name": item.name if item else "Unknown"})
    return result

@app.put("/api/sales/{sale_id}", response_model=SaleResponse)
def update_sale(sale_id: int, update: SaleUpdate, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id, Sale.shop_id == x_shop_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    item = db.query(Item).filter(Item.id == sale.item_id).first()
    stock_diff = sale.quantity - update.quantity
    item.current_stock += stock_diff
    item.updated_at = datetime.now(timezone.utc)
    sale.quantity = update.quantity
    sale.selling_price = update.selling_price
    db.commit()
    db.refresh(sale)
    return {**sale.__dict__, "item_name": item.name if item else "Unknown"}

@app.delete("/api/sales/{sale_id}")
def delete_sale(sale_id: int, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id, Sale.shop_id == x_shop_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    item = db.query(Item).filter(Item.id == sale.item_id).first()
    if item:
        item.current_stock += sale.quantity
        item.updated_at = datetime.now(timezone.utc)
    db.delete(sale)
    db.commit()
    return {"message": "Sale deleted and stock restored"}

# --- Dashboard ---

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    def get_sales_in_period(start):
        return db.query(Sale).filter(Sale.shop_id == x_shop_id, Sale.sale_date >= start).all()

    def calc_profit(sales):
        profit = 0.0
        for s in sales:
            item = db.query(Item).filter(Item.id == s.item_id).first()
            if item:
                profit += (s.selling_price - item.cost_price) * s.quantity
        return round(profit, 2)

    today_sales = get_sales_in_period(today_start)
    week_sales = get_sales_in_period(week_start)
    month_sales = get_sales_in_period(month_start)

    low_stock = db.query(Item).filter(Item.shop_id == x_shop_id, Item.current_stock <= Item.low_stock_threshold).all()

    from sqlalchemy import func
    best_raw = db.query(Sale.item_id, func.sum(Sale.quantity).label("total_qty"))\
        .filter(Sale.shop_id == x_shop_id, Sale.sale_date >= month_start)\
        .group_by(Sale.item_id).order_by(func.sum(Sale.quantity).desc()).limit(5).all()
    best_selling = []
    for row in best_raw:
        item = db.query(Item).filter(Item.id == row.item_id).first()
        if item:
            best_selling.append({"name": item.name, "total_quantity_sold": row.total_qty})

    slow_raw = db.query(Sale.item_id, func.sum(Sale.quantity).label("total_qty"))\
        .filter(Sale.shop_id == x_shop_id, Sale.sale_date >= month_start)\
        .group_by(Sale.item_id).order_by(func.sum(Sale.quantity).asc()).limit(5).all()
    slow_moving = []
    for row in slow_raw:
        item = db.query(Item).filter(Item.id == row.item_id).first()
        if item:
            slow_moving.append({"name": item.name, "total_quantity_sold": row.total_qty})

    return DashboardStats(
        daily_profit=calc_profit(today_sales),
        weekly_profit=calc_profit(week_sales),
        monthly_profit=calc_profit(month_sales),
        total_sales_today=len(today_sales),
        total_sales_week=len(week_sales),
        total_sales_month=len(month_sales),
        low_stock_items=low_stock,
        best_selling_items=best_selling,
        slow_moving_items=slow_moving
    )

# --- Customers ---

@app.post("/api/customers", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    new_customer = Customer(**customer.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@app.get("/api/customers", response_model=List[CustomerResponse])
def list_customers(x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    return db.query(Customer).filter(Customer.shop_id == x_shop_id).all()

@app.get("/api/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.delete("/api/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted"}

# --- Debt Records ---

@app.post("/api/debt/records", response_model=DebtRecordResponse)
def create_debt(debt: DebtRecordCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == debt.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if debt.type == 'debt':
        customer.total_debt += debt.amount
    elif debt.type == 'payment':
        customer.total_debt = max(0, customer.total_debt - debt.amount)
    new_debt = DebtRecord(**debt.model_dump())
    db.add(new_debt)
    db.commit()
    db.refresh(new_debt)
    return new_debt

@app.get("/api/debt/records/{customer_id}", response_model=List[DebtRecordResponse])
def list_debts(customer_id: int, db: Session = Depends(get_db)):
    return db.query(DebtRecord).filter(DebtRecord.customer_id == customer_id).order_by(DebtRecord.date.desc()).all()

# --- AI Assistant ---

@app.post("/api/ai/chat", response_model=AIChatResponse)
def ai_chat(request: AIChatRequest, db: Session = Depends(get_db)):
    try:
        ai = AIService(db)
        response = ai.chat(request.message, request.shop_id, request.context)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/deep-insights", response_model=List[DeepInsight])
def get_deep_insights(x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    ai = AIService(db)
    return ai.get_deep_insights(x_shop_id)

@app.get("/api/ai/restock-recommendations")
def get_restock_recommendations(x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    ai = AIService(db)
    insights = ai.get_deep_insights(x_shop_id)
    critical = [f"{i['name']} (Stock: {i['days_remaining']} days left)" for i in insights if i['restock_score'] >= 70]
    return {"recommendations": critical if critical else ["All stock levels are healthy."]}

@app.get("/api/ai/trends")
def get_trends(x_shop_id: int = Header(..., alias="X-Shop-Id"), db: Session = Depends(get_db)):
    return {"trends": "Stable growth across core categories."}

@app.get("/api/ai/customer-risk/{customer_id}")
def get_customer_risk(customer_id: int, db: Session = Depends(get_db)):
    ai = AIService(db)
    return ai.get_customer_risk(customer_id)

@app.get("/api/ai/suggestions/{item_id}")
def get_suggestions(item_id: int, db: Session = Depends(get_db)):
    return [
        {"name": "Bundle offer", "type": "margin", "reason": "High demand item"},
        {"name": "Suggest complementary", "type": "upsell", "reason": "Commonly bought together"}
    ]
