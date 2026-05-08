import os
import logging
from pathlib import Path
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from groq import Groq
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Explicitly load .env from the backend root (two levels up from this file)
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
else:
    load_dotenv()

logger = logging.getLogger(__name__)


def _get_groq_api_key() -> Optional[str]:
    for name in ("GROQ_API_KEY", "GROQ_KEY"):
        value = os.getenv(name)
        if value and value.strip() and "your_groq_api_key_here" not in value.lower():
            logger.info(f"GROQ API key found from env var: {name}")
            return value.strip()
    logger.warning("No GROQ_API_KEY or GROQ_KEY environment variable found.")
    return None


def _get_groq_client() -> Optional[Groq]:
    groq_api_key = _get_groq_api_key()
    return Groq(api_key=groq_api_key) if groq_api_key else None


class AIService:
    def __init__(self, db: Session):
        self.db = db

    def _local_analysis(self, message: str, shop_id: int) -> dict:
        from app.models import Item, Sale

        normalized = message.lower()
        items = self.db.query(Item).filter(Item.shop_id == shop_id).all()
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        sales = self.db.query(Sale).filter(
            Sale.shop_id == shop_id,
            Sale.sale_date >= thirty_days_ago
        ).all()

        if not items:
            return {
                "response": "I do not see any stock items yet. Add products and a few sales first, then I can spot slow movers, restock needs, and profit trends.",
                "insights": [],
                "recommendations": ["Add your main products in Stock.", "Record daily sales so the assistant can learn your shop pattern."]
            }

        sales_by_item: Dict[int, int] = {}
        revenue_by_item: Dict[int, float] = {}
        profit_by_item: Dict[int, float] = {}
        item_lookup = {item.id: item for item in items}

        for sale in sales:
            item = item_lookup.get(sale.item_id)
            if not item:
                continue
            sales_by_item[item.id] = sales_by_item.get(item.id, 0) + sale.quantity
            revenue_by_item[item.id] = revenue_by_item.get(item.id, 0) + (sale.quantity * sale.selling_price)
            profit_by_item[item.id] = profit_by_item.get(item.id, 0) + (sale.quantity * (sale.selling_price - item.cost_price))

        if "slow" in normalized or "moving" in normalized:
            ranked = sorted(items, key=lambda item: (sales_by_item.get(item.id, 0), -item.current_stock))[:5]
            lines = [
                f"{item.name}: {sales_by_item.get(item.id, 0)} sold in 30 days, {item.current_stock} in stock"
                for item in ranked
            ]
            return {
                "response": "These items are moving slowly based on the last 30 days of sales:\n\n" + "\n".join(lines),
                "insights": lines,
                "recommendations": [
                    "Avoid restocking these items until current stock reduces.",
                    "Try a small bundle, discount, or front-shelf placement for the highest-stock slow movers."
                ]
            }

        if "revenue" in normalized or "top" in normalized or "driver" in normalized:
            ranked = sorted(items, key=lambda item: revenue_by_item.get(item.id, 0), reverse=True)[:5]
            lines = [
                f"{item.name}: revenue {revenue_by_item.get(item.id, 0):,.0f}, quantity sold {sales_by_item.get(item.id, 0)}"
                for item in ranked
            ]
            return {
                "response": "Your top revenue drivers for the last 30 days are:\n\n" + "\n".join(lines),
                "insights": lines,
                "recommendations": ["Keep these products visible and stocked.", "Check their margins before running discounts."]
            }

        if "profit" in normalized or "trajectory" in normalized:
            total_profit = sum(profit_by_item.values())
            total_revenue = sum(revenue_by_item.values())
            margin = (total_profit / total_revenue * 100) if total_revenue else 0
            return {
                "response": f"Estimated 30-day profit is {total_profit:,.0f} from {total_revenue:,.0f} revenue. That is about a {margin:.1f}% gross margin.",
                "insights": [
                    f"30-day revenue: {total_revenue:,.0f}",
                    f"30-day gross profit: {total_profit:,.0f}",
                    f"Gross margin: {margin:.1f}%"
                ],
                "recommendations": ["Focus on high-margin fast sellers.", "Review cost prices for items with weak profit contribution."]
            }

        insights = self.get_deep_insights(shop_id)
        urgent = [insight for insight in insights if insight["restock_score"] >= 70][:5]
        if urgent:
            lines = [
                f"{item['name']}: about {item['days_remaining']} days left, restock {item['suggested_restock_qty']}"
                for item in urgent
            ]
            return {
                "response": "These items need restock attention:\n\n" + "\n".join(lines),
                "insights": lines,
                "recommendations": ["Restock the highest-score items first.", "Use the suggested quantities as a starting point, then adjust for available cash."]
            }

        return {
            "response": "Your stock looks stable from the data I can see. Keep recording sales and I will give sharper restock, profit, and slow-moving item advice.",
            "insights": ["No urgent restock items found right now."],
            "recommendations": ["Record sales daily for better predictions."]
        }

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
        client = _get_groq_client()
        if not client:
            return self._local_analysis(message, shop_id)

        shop_context = self._get_shop_context(shop_id)
        system_prompt = f"""You are Notable, an AI assistant for a Nigerian provision shop management system.
You help shop owners track sales, manage inventory, and grow their business.

Current shop context:
{shop_context}

Be concise, practical, and use simple language. If asked about stock or sales, use the context above.
Respond in English. Keep responses under 150 words."""

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
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
