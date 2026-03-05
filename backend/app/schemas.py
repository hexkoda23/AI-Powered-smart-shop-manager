from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class ShopBase(BaseModel):
    name: str

class ShopCreate(ShopBase):
    password: str = Field(..., max_length=10)

class ShopLogin(ShopBase):
    password: str

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    owner_pin: Optional[str] = None

class ShopOwnerPinSetup(BaseModel):
    pin: str = Field(..., min_length=4, max_length=4)

class ShopResponse(ShopBase):
    id: int
    created_at: datetime
    is_pin_set: bool
    model_config = ConfigDict(from_attributes=True)


class ItemBase(BaseModel):
    name: str
    current_stock: int = 0
    low_stock_threshold: int = 10
    unit_price: float = 0.0
    cost_price: float = 0.0

class ItemCreate(ItemBase):
    shop_id: int

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    current_stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    unit_price: Optional[float] = None
    cost_price: Optional[float] = None

class ItemResponse(ItemBase):
    id: int
    shop_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SaleCreate(BaseModel):
    shop_id: int
    item_name: str
    quantity: int = Field(gt=0)
    selling_price: float = Field(gt=0)
    sale_date: Optional[datetime] = None

class SaleResponse(BaseModel):
    id: int
    shop_id: int
    item_id: int
    item_name: str
    quantity: int
    selling_price: float
    sale_date: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: float = 50000.0

class CustomerCreate(CustomerBase):
    shop_id: int

class CustomerResponse(CustomerBase):
    id: int
    shop_id: int
    total_debt: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DebtRecordCreate(BaseModel):
    customer_id: int
    amount: float
    type: str  # 'debt' or 'payment'
    notes: Optional[str] = None

class DebtRecordResponse(BaseModel):
    id: int
    customer_id: int
    amount: float
    type: str
    date: datetime
    notes: Optional[str] = None
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
    shop_id: int
    context: Optional[dict] = None

class AIChatResponse(BaseModel):
    response: str
    insights: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
