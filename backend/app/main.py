from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional
from passlib.context import CryptContext

from app.database import get_db, engine, Base
from app.models import Item, Sale, StockHistory, Shop, Customer, DebtRecord
from app.schemas import (
    ItemCreate, ItemUpdate, ItemResponse,
    SaleCreate, SaleResponse,
    DashboardStats, AIChatRequest, AIChatResponse,
    ShopCreate, ShopLogin, ShopResponse, ShopUpdate, ShopOwnerPinSetup,
    CustomerCreate, CustomerResponse, DebtRecordCreate, DebtRecordResponse
)
from app.ai_service import AIService

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Notable AI Shop Assistant",
    description="Smart multi-shop assistant for managing sales, stock, and business insights",
    version="2.0.0"
)

# Password Hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Notable AI Multi-Shop API"}


# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=ShopResponse)
def register_shop(shop: ShopCreate, db: Session = Depends(get_db)):
    existing = db.query(Shop).filter(Shop.name == shop.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Store name already registered")
    
    hashed_password = pwd_context.hash(shop.password)
    db_shop = Shop(name=shop.name, password_hash=hashed_password)
    db.add(db_shop)
    db.commit()
    db.refresh(db_shop)
    
    # Add attributes for schema response
    db_shop.is_pin_set = False
    return db_shop


@app.post("/api/auth/login", response_model=ShopResponse)
def login_shop(login: ShopLogin, db: Session = Depends(get_db)):
    db_shop = db.query(Shop).filter(Shop.name == login.name).first()
    if not db_shop or not pwd_context.verify(login.password, db_shop.password_hash):
        raise HTTPException(status_code=401, detail="Invalid store name or password")
    
    return {
        "id": db_shop.id,
        "name": db_shop.name,
        "created_at": db_shop.created_at,
        "is_pin_set": db_shop.pin_hash is not None
    }


@app.post("/api/auth/set-owner-pin", response_model=ShopResponse)
def set_owner_pin(setup: ShopOwnerPinSetup, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    db_shop = db.query(Shop).filter(Shop.id == x_shop_id).first()
    if not db_shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    db_shop.pin_hash = pwd_context.hash(setup.pin)
    db.commit()
    db.refresh(db_shop)
    
    return {
        "id": db_shop.id,
        "name": db_shop.name,
        "created_at": db_shop.created_at,
        "is_pin_set": True
    }


@app.post("/api/auth/verify-owner-pin")
def verify_owner_pin(setup: ShopOwnerPinSetup, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    db_shop = db.query(Shop).filter(Shop.id == x_shop_id).first()
    if not db_shop or not db_shop.pin_hash:
        raise HTTPException(status_code=401, detail="PIN not set")
    
    if not pwd_context.verify(setup.pin, db_shop.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    return {"status": "success"}


@app.put("/api/shops/settings", response_model=ShopResponse)
def update_shop_settings(shop_update: ShopUpdate, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    db_shop = db.query(Shop).filter(Shop.id == x_shop_id).first()
    if not db_shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    if shop_update.name:
        existing = db.query(Shop).filter(Shop.name == shop_update.name, Shop.id != x_shop_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Store name already taken")
        db_shop.name = shop_update.name
    
    if shop_update.password:
        db_shop.password_hash = pwd_context.hash(shop_update.password)
    
    if shop_update.owner_pin:
        db_shop.pin_hash = pwd_context.hash(shop_update.owner_pin)
    
    db.commit()
    db.refresh(db_shop)
    
    return {
        "id": db_shop.id,
        "name": db_shop.name,
        "created_at": db_shop.created_at,
        "is_pin_set": db_shop.pin_hash is not None
    }


# --- Items Endpoints ---

@app.post("/api/items", response_model=ItemResponse)
def create_item(item: ItemCreate, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    # Check if item already exists in this shop
    existing = db.query(Item).filter(Item.name == item.name, Item.shop_id == x_shop_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item already exists in this shop")
    
    db_item = Item(**item.dict())
    db_item.shop_id = x_shop_id # Ensure shop_id from header
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/api/items", response_model=List[ItemResponse])
def get_items(x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    return db.query(Item).filter(Item.shop_id == x_shop_id).all()


@app.get("/api/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id, Item.shop_id == x_shop_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/api/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_update: ItemUpdate, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id, Item.shop_id == x_shop_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
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
    return {"message": "Item deleted successfully"}


# --- Sales Endpoints ---

@app.post("/api/sales", response_model=SaleResponse)
def create_sale(sale: SaleCreate, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.name == sale.item_name, Item.shop_id == x_shop_id).first()
    if not item:
        item = Item(name=sale.item_name, shop_id=x_shop_id, current_stock=0)
        db.add(item)
        db.flush()
    
    sale_date = sale.sale_date or datetime.now()
    db_sale = Sale(
        item_id=item.id,
        shop_id=x_shop_id,
        quantity=sale.quantity,
        selling_price=sale.selling_price,
        sale_date=sale_date
    )
    db.add(db_sale)
    
    item.current_stock = max(0, item.current_stock - sale.quantity)
    
    stock_history = StockHistory(
        item_id=item.id,
        shop_id=x_shop_id,
        quantity_change=-sale.quantity,
        change_type='sale',
        notes=f"Sale of {sale.quantity} units"
    )
    db.add(stock_history)
    
    db.commit()
    db.refresh(db_sale)
    
    return {
        "id": db_sale.id,
        "shop_id": db_sale.shop_id,
        "item_id": db_sale.item_id,
        "item_name": item.name,
        "quantity": db_sale.quantity,
        "selling_price": db_sale.selling_price,
        "sale_date": db_sale.sale_date,
        "created_at": db_sale.created_at
    }


@app.get("/api/sales", response_model=List[SaleResponse])
def get_sales(
    x_shop_id: int = Header(...),
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Sale).filter(Sale.shop_id == x_shop_id)
    
    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    
    sales = query.order_by(desc(Sale.sale_date)).limit(limit).all()
    
    result = []
    for sale in sales:
        result.append({
            "id": sale.id,
            "shop_id": sale.shop_id,
            "item_id": sale.item_id,
            "item_name": sale.item.name,
            "quantity": sale.quantity,
            "selling_price": sale.selling_price,
            "sale_date": sale.sale_date,
            "created_at": sale.created_at
        })
    
    return result


# --- Customer & Debt Endpoints ---

@app.post("/api/customers", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    db_customer = Customer(**customer.dict())
    db_customer.shop_id = x_shop_id
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@app.get("/api/customers", response_model=List[CustomerResponse])
def get_customers(x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    return db.query(Customer).filter(Customer.shop_id == x_shop_id).all()


@app.post("/api/debt/records", response_model=DebtRecordResponse)
def create_debt_record(record: DebtRecordCreate, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == record.customer_id, Customer.shop_id == x_shop_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db_record = DebtRecord(**record.dict())
    db.add(db_record)
    
    if record.type == 'debt':
        customer.total_debt += record.amount
    else:
        customer.total_debt -= record.amount
        
    db.commit()
    db.refresh(db_record)
    return db_record


@app.get("/api/debt/records/{customer_id}", response_model=List[DebtRecordResponse])
def get_customer_debt_records(customer_id: int, x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    # Verify customer belongs to shop
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.shop_id == x_shop_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return db.query(DebtRecord).filter(DebtRecord.customer_id == customer_id).all()


# --- Dashboard & AI Endpoints ---

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(x_shop_id: int = Header(...), db: Session = Depends(get_db)):
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    try:
        shop_sales = db.query(Sale).filter(Sale.shop_id == x_shop_id).join(Item).all()
        
        daily_profit = sum((s.selling_price - s.item.cost_price) * s.quantity for s in shop_sales if s.sale_date >= today_start)
        weekly_profit = sum((s.selling_price - s.item.cost_price) * s.quantity for s in shop_sales if s.sale_date >= week_start)
        monthly_profit = sum((s.selling_price - s.item.cost_price) * s.quantity for s in shop_sales if s.sale_date >= month_start)
        
        total_sales_today = sum(s.quantity for s in shop_sales if s.sale_date >= today_start)
        total_sales_week = sum(s.quantity for s in shop_sales if s.sale_date >= week_start)
        total_sales_month = sum(s.quantity for s in shop_sales if s.sale_date >= month_start)
        
        low_stock_items = db.query(Item).filter(Item.shop_id == x_shop_id, Item.current_stock <= Item.low_stock_threshold).all()
        
        best_selling = db.query(Item.name, func.sum(Sale.quantity).label('total_quantity'))\
            .join(Sale).filter(Sale.shop_id == x_shop_id, Sale.sale_date >= month_start)\
            .group_by(Item.name).order_by(desc('total_quantity')).limit(5).all()
        
        slow_moving = db.query(Item.name, func.coalesce(func.sum(Sale.quantity), 0).label('total_quantity'))\
            .outerjoin(Sale, Sale.item_id == Item.id).filter(Item.shop_id == x_shop_id)\
            .group_by(Item.name).order_by('total_quantity').limit(5).all()
        
        return DashboardStats(
            daily_profit=daily_profit,
            weekly_profit=weekly_profit,
            monthly_profit=monthly_profit,
            total_sales_today=total_sales_today,
            total_sales_week=total_sales_week,
            total_sales_month=total_sales_month,
            low_stock_items=low_stock_items,
            best_selling_items=[{"name": name, "quantity": int(qty or 0)} for name, qty in best_selling],
            slow_moving_items=[{"name": name, "quantity": int(qty or 0)} for name, qty in slow_moving]
        )
    except Exception as e:
        print(f"DASHBOARD_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database integration error: {str(e)}")


@app.post("/api/ai/chat", response_model=AIChatResponse)
def ai_chat(request: AIChatRequest, db: Session = Depends(get_db)):
    ai_service = AIService(db)
    result = ai_service.chat(request.message, shop_id=request.shop_id)
    return AIChatResponse(**result)


@app.get("/api/ai/restock-recommendations")
def get_restock_recommendations(db: Session = Depends(get_db)):
    ai_service = AIService(db)
    recommendations = ai_service.generate_restock_recommendations()
    return {"recommendations": recommendations}


@app.get("/api/ai/trends")
def get_trends(db: Session = Depends(get_db)):
    ai_service = AIService(db)
    trends = ai_service.analyze_trends()
    return trends
