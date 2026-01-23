from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List

from app.database import get_db, engine, Base
from app.models import Item, Sale, StockHistory
from app.schemas import (
    ItemCreate, ItemUpdate, ItemResponse,
    SaleCreate, SaleResponse,
    DashboardStats, AIChatRequest, AIChatResponse
)
from app.ai_service import AIService

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Notable AI Shop Assistant",
    description="Smart shop assistant for managing sales, stock, and business insights",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Notable AI Shop Assistant API"}


# Items endpoints
@app.post("/api/items", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    # Check if item already exists
    existing = db.query(Item).filter(Item.name == item.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item already exists")
    
    db_item = Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/api/items", response_model=List[ItemResponse])
def get_items(db: Session = Depends(get_db)):
    items = db.query(Item).all()
    return items


@app.get("/api/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/api/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_update: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}


# Sales endpoints
@app.post("/api/sales", response_model=SaleResponse)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    # Find or create item
    item = db.query(Item).filter(Item.name == sale.item_name).first()
    if not item:
        # Auto-create item if it doesn't exist
        item = Item(name=sale.item_name, current_stock=0)
        db.add(item)
        db.flush()
    
    # Create sale record
    sale_date = sale.sale_date or datetime.now()
    db_sale = Sale(
        item_id=item.id,
        quantity=sale.quantity,
        selling_price=sale.selling_price,
        sale_date=sale_date
    )
    db.add(db_sale)
    
    # Update stock
    item.current_stock = max(0, item.current_stock - sale.quantity)
    
    # Record stock history
    stock_history = StockHistory(
        item_id=item.id,
        quantity_change=-sale.quantity,
        change_type='sale',
        notes=f"Sale of {sale.quantity} units"
    )
    db.add(stock_history)
    
    db.commit()
    db.refresh(db_sale)
    
    # Return sale with item name
    return {
        "id": db_sale.id,
        "item_id": db_sale.item_id,
        "item_name": item.name,
        "quantity": db_sale.quantity,
        "selling_price": db_sale.selling_price,
        "sale_date": db_sale.sale_date,
        "created_at": db_sale.created_at
    }


@app.get("/api/sales", response_model=List[SaleResponse])
def get_sales(
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Sale)
    
    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    
    sales = query.order_by(desc(Sale.sale_date)).limit(limit).all()
    
    result = []
    for sale in sales:
        result.append({
            "id": sale.id,
            "item_id": sale.item_id,
            "item_name": sale.item.name,
            "quantity": sale.quantity,
            "selling_price": sale.selling_price,
            "sale_date": sale.sale_date,
            "created_at": sale.created_at
        })
    
    return result


# Dashboard endpoints
@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # Get sales with item details
    all_sales = db.query(Sale).join(Item).all()
    
    # Calculate profits
    daily_profit = sum(
        (sale.selling_price - sale.item.cost_price) * sale.quantity
        for sale in all_sales if sale.sale_date >= today_start
    )
    
    weekly_profit = sum(
        (sale.selling_price - sale.item.cost_price) * sale.quantity
        for sale in all_sales if sale.sale_date >= week_start
    )
    
    monthly_profit = sum(
        (sale.selling_price - sale.item.cost_price) * sale.quantity
        for sale in all_sales if sale.sale_date >= month_start
    )
    
    # Total sales counts
    total_sales_today = sum(sale.quantity for sale in all_sales if sale.sale_date >= today_start)
    total_sales_week = sum(sale.quantity for sale in all_sales if sale.sale_date >= week_start)
    total_sales_month = sum(sale.quantity for sale in all_sales if sale.sale_date >= month_start)
    
    # Low stock items
    low_stock_items = db.query(Item).filter(
        Item.current_stock <= Item.low_stock_threshold
    ).all()
    
    # Best selling items (last 30 days)
    best_selling = db.query(
        Item.name,
        func.sum(Sale.quantity).label('total_quantity')
    ).join(Sale).filter(
        Sale.sale_date >= month_start
    ).group_by(Item.name).order_by(desc('total_quantity')).limit(5).all()
    
    best_selling_items = [
        {"name": name, "quantity": int(qty)} for name, qty in best_selling
    ]
    
    # Slow moving items (items with low sales)
    all_items_with_sales = db.query(
        Item.name,
        func.coalesce(func.sum(Sale.quantity), 0).label('total_quantity')
    ).outerjoin(Sale, Sale.item_id == Item.id).filter(
        Sale.sale_date >= month_start
    ).group_by(Item.name).all()
    
    slow_moving = sorted(all_items_with_sales, key=lambda x: x[1])[:5]
    slow_moving_items = [
        {"name": name, "quantity": int(qty)} for name, qty in slow_moving
    ]
    
    return DashboardStats(
        daily_profit=daily_profit,
        weekly_profit=weekly_profit,
        monthly_profit=monthly_profit,
        total_sales_today=total_sales_today,
        total_sales_week=total_sales_week,
        total_sales_month=total_sales_month,
        low_stock_items=low_stock_items,
        best_selling_items=best_selling_items,
        slow_moving_items=slow_moving_items
    )


# AI Assistant endpoints
@app.post("/api/ai/chat", response_model=AIChatResponse)
def ai_chat(request: AIChatRequest, db: Session = Depends(get_db)):
    ai_service = AIService(db)
    result = ai_service.chat(request.message)
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
