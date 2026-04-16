import os
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from groq import Groq
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY") or os.getenv("notable")
client = Groq(api_key=groq_api_key) if groq_api_key else None


class AIService:
    def __init__(self, db: Session):
        self.db = db

    def _get_shop_context(self, shop_id: int) -> str:
        from app.models import Item, Sale
        items = self.db.query(Item).filter(Item.shop_id == shop_id).all()
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        recent_sales = self.db.query(Sale).filter(
            Sale.shop_id == shop_id,
            Sale.sale_date >= week_ago
        ).all()

        item_data = [
            {
                "name": item.name,
                "stock": item.current_stock,
                "selling_price": item.selling_price,
                "cost_price": item.cost_price,
                "low_threshold": item.low_stock_threshold
            }
            for item in items
        ]

        sales_data = []
        for sale in recent_sales:
            item = self.db.query(Item).filter(Item.id == sale.item_id).first()
            if item:
                sales_data.append({
                    "item": item.name,
                    "qty": sale.quantity,
                    "price": sale.selling_price,
                    "date": sale.sale_date.isoformat()
                })

        context_parts = [
            f"Shop has {len(items)} products.",
            f"Recent 7-day sales: {len(recent_sales)} transactions.",
        ]

        low_stock = [i for i in item_data if i["stock"] <= i["low_threshold"]]
        if low_stock:
            names = ", ".join([i["name"] for i in low_stock[:5]])
            context_parts.append(f"Low stock items: {names}.")

        if sales_data:
            df = pd.DataFrame(sales_data)
            top = df.groupby("item")["qty"].sum().nlargest(3)
            context_parts.append(f"Top sellers this week: {', '.join(top.index.tolist())}.")

        return " ".join(context_parts)

    def chat(self, message: str, shop_id: int, context: Optional[dict] = None) -> dict:
        if not client:
            return {
                "response": "AI service is currently unavailable. Please set the GROQ API key.",
                "insights": [],
                "recommendations": []
            }

        shop_context = self._get_shop_context(shop_id)
        system_prompt = f"""You are Notable, an AI assistant for a Nigerian provision shop management system.
You help shop owners track sales, manage inventory, and grow their business.

Current shop context:
{shop_context}

Be concise, practical, and use simple language. If asked about stock or sales, use the context above.
Respond in English. Keep responses under 150 words."""

        try:
            response = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=300,
                temperature=0.7
            )
            reply = response.choices[0].message.content
            return {
                "response": reply,
                "insights": [],
                "recommendations": []
            }
        except Exception as e:
            return {
                "response": f"Sorry, I encountered an error: {str(e)}",
                "insights": [],
                "recommendations": []
            }

    def get_deep_insights(self, shop_id: int) -> List[Dict]:
        from app.models import Item, Sale
        items = self.db.query(Item).filter(Item.shop_id == shop_id).all()
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        
        insights = []
        for item in items:
            # Calculate daily burn rate
            sales = self.db.query(Sale).filter(
                Sale.item_id == item.id,
                Sale.sale_date >= thirty_days_ago
            ).all()
            total_qty = sum(s.quantity for s in sales)
            daily_burn = round(total_qty / 30, 2)
            
            # Days remaining
            if daily_burn > 0:
                days_left = int(item.current_stock / daily_burn)
            else:
                days_left = 999
            
            # Restock score (0-100, higher is more urgent)
            restock_score = max(0, min(100, (14 - days_left) * 7.14)) if days_left < 14 else 0
            if item.current_stock <= item.low_stock_threshold:
                restock_score = max(restock_score, 80)
                
            insights.append({
                "id": item.id,
                "name": item.name,
                "days_remaining": min(days_left, 999),
                "daily_burn_rate": daily_burn,
                "restock_score": round(restock_score, 1),
                "suggested_restock_qty": int(daily_burn * 30) if daily_burn > 0 else 10
            })
            
        return sorted(insights, key=lambda x: x['restock_score'], reverse=True)

    def get_customer_risk(self, customer_id: int) -> Dict:
        from app.models import Customer
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return {"risk": "LOW", "current": 0, "limit": 0}
            
        ratio = customer.total_debt / customer.credit_limit if customer.credit_limit > 0 else 1
        risk = "LOW"
        if ratio > 0.8: risk = "HIGH"
        elif ratio > 0.5: risk = "MEDIUM"
        
        return {
            "risk": risk,
            "current": customer.total_debt,
            "limit": customer.credit_limit
        }
