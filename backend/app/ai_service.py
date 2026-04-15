import os
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from groq import Groq
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

groq_api_key = os.getenv("notable")
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
