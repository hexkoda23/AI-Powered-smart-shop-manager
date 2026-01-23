from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class ItemBase(BaseModel):
    name: str
    current_stock: int = 0
    low_stock_threshold: int = 10
    unit_price: float = 0.0
    cost_price: float = 0.0


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    current_stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    unit_price: Optional[float] = None
    cost_price: Optional[float] = None


class ItemResponse(ItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SaleCreate(BaseModel):
    item_name: str
    quantity: int = Field(gt=0)
    selling_price: float = Field(gt=0)
    sale_date: Optional[datetime] = None


class SaleResponse(BaseModel):
    id: int
    item_id: int
    item_name: str
    quantity: int
    selling_price: float
    sale_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardStats(BaseModel):
    daily_profit: float
    weekly_profit: float
    monthly_profit: float
    total_sales_today: int
    total_sales_week: int
    total_sales_month: int
    low_stock_items: List[ItemResponse]
    best_selling_items: List[dict]
    slow_moving_items: List[dict]


class AIChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


class AIChatResponse(BaseModel):
    response: str
    insights: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
