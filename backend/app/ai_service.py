import os
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from groq import Groq
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Sale, Item, Shop
from dotenv import load_dotenv

load_dotenv()

groq_api_key = os.getenv("notable")
client = Groq(api_key=groq_api_key) if groq_api_key else None


class AIService:
    def __init__(self, db: Session):
        self.db = db

    def get_sales_data(self, days: int = 30) -> pd.DataFrame:
        """Fetch sales data for analysis"""
        cutoff_date = datetime.now() - timedelta(days=days)
        sales = self.db.query(Sale).filter(Sale.sale_date >= cutoff_date).all()
        
        data = []
        for sale in sales:
            data.append({
                'item_name': sale.item.name,
                'quantity': sale.quantity,
                'selling_price': sale.selling_price,
                'sale_date': sale.sale_date,
                'cost_price': sale.item.cost_price,
                'profit': (sale.selling_price - sale.item.cost_price) * sale.quantity
            })
        
        return pd.DataFrame(data)

    def get_stock_data(self) -> pd.DataFrame:
        """Fetch current stock data"""
        items = self.db.query(Item).all()
        data = []
        for item in items:
            # Get recent sales for this item
            recent_sales = self.db.query(func.sum(Sale.quantity)).filter(
                Sale.item_id == item.id,
                Sale.sale_date >= datetime.now() - timedelta(days=7)
            ).scalar() or 0
            
            data.append({
                'item_name': item.name,
                'current_stock': item.current_stock,
                'low_stock_threshold': item.low_stock_threshold,
                'recent_sales_7d': recent_sales,
                'is_low_stock': item.current_stock <= item.low_stock_threshold
            })
        
        return pd.DataFrame(data)

    def analyze_trends(self) -> Dict:
        """Analyze sales trends and patterns"""
        sales_df = self.get_sales_data(30)
        stock_df = self.get_stock_data()
        
        if sales_df.empty:
            return {
                'fast_moving': [],
                'slow_moving': [],
                'high_profit': [],
                'trends': []
            }
        
        # Fast moving items (high quantity sold)
        fast_moving = sales_df.groupby('item_name')['quantity'].sum().sort_values(ascending=False).head(5)
        
        # Slow moving items
        slow_moving = sales_df.groupby('item_name')['quantity'].sum().sort_values(ascending=True).head(5)
        
        # High profit items
        high_profit = sales_df.groupby('item_name')['profit'].sum().sort_values(ascending=False).head(5)
        
        # Daily sales pattern
        sales_df['day_of_week'] = pd.to_datetime(sales_df['sale_date']).dt.day_name()
        daily_pattern = sales_df.groupby('day_of_week')['quantity'].sum().to_dict()
        
        return {
            'fast_moving': fast_moving.to_dict(),
            'slow_moving': slow_moving.to_dict(),
            'high_profit': high_profit.to_dict(),
            'daily_pattern': daily_pattern,
            'total_profit_30d': sales_df['profit'].sum(),
            'total_sales_30d': sales_df['quantity'].sum()
        }

    def generate_restock_recommendations(self) -> List[str]:
        """Generate smart restock recommendations"""
        stock_df = self.get_stock_data()
        sales_df = self.get_sales_data(7)
        
        recommendations = []
        
        # Items that are low stock
        low_stock = stock_df[stock_df['is_low_stock']]
        for _, item in low_stock.iterrows():
            recommendations.append(f"{item['item_name']} is running low ({item['current_stock']} left). Restock soon.")
        
        # Items with high recent sales but not yet low stock
        if not sales_df.empty:
            high_sales = sales_df.groupby('item_name')['quantity'].sum().sort_values(ascending=False).head(5)
            for item_name, qty in high_sales.items():
                item_stock = stock_df[stock_df['item_name'] == item_name]
                if not item_stock.empty and item_stock.iloc[0]['current_stock'] < 20:
                    recommendations.append(f"{item_name} is selling fast ({qty} sold this week). Consider restocking.")
        
        return recommendations

    def get_deep_insights(self) -> List[Dict]:
        """Generate deep insights for inventory items"""
        items = self.db.query(Item).all()
        insights = []
        
        for item in items:
            sales_30d = self.db.query(func.sum(Sale.quantity)).filter(
                Sale.item_id == item.id,
                Sale.sale_date >= datetime.now() - timedelta(days=30)
            ).scalar() or 0
            
            daily_burn_rate = round(sales_30d / 30.0, 1)
            
            if daily_burn_rate > 0:
                days_remaining = int(item.current_stock / daily_burn_rate)
            else:
                days_remaining = 999
                
            if item.current_stock == 0:
                restock_score = 100
            elif days_remaining <= 7 or item.current_stock <= item.low_stock_threshold:
                restock_score = min(100, max(50, int(100 - (days_remaining * 5))))
            else:
                restock_score = max(0, int(30 - (days_remaining)))
                
            suggested_restock_qty = int(daily_burn_rate * 30)
            if suggested_restock_qty < item.low_stock_threshold * 2:
                suggested_restock_qty = item.low_stock_threshold * 2
                
            insights.append({
                "id": item.id,
                "name": item.name,
                "days_remaining": days_remaining,
                "daily_burn_rate": daily_burn_rate,
                "restock_score": restock_score,
                "suggested_restock_qty": suggested_restock_qty
            })
            
        return insights

    def chat(self, user_message: str, shop_id: int) -> Dict:
        """Handle AI chat queries"""
        # Get context data
        trends = self.analyze_trends()
        stock_df = self.get_stock_data()
        sales_df = self.get_sales_data(30)
        recommendations = self.generate_restock_recommendations()
        
        # Prepare context for AI
        shop = self.db.query(Shop).filter(Shop.id == shop_id).first()
        shop_name = shop.name if shop else "Unknown Shop"
        
        context = f"""
        Shop Name: {shop_name}
        Fast moving items: {trends['fast_moving']}
        High profit items: {trends['high_profit']}
        Current stock situation: {len(recommendations)} items need attention.
        Top 3 restock recommendations: {', '.join(recommendations[:3])}
        """
        
        if not client:
            return {
                'response': f"Based on your shop data: {user_message}. Please ensure your 'notable' API key is configured in the .env file for AI-powered insights.",
                'insights': [], # Simplified fallback
                'recommendations': recommendations[:3]
            }

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a helpful shop assistant AI for 'Notable'. You help shop owners understand their business through simple, clear language. 
                        You analyze sales data, stock levels, and provide actionable insights. Always be friendly, concise, and practical.
                        Focus on what matters: what to restock, what's selling well, and profit insights. Use Naira (₦) for currency."""
                    },
                    {
                        "role": "user",
                        "content": f"Context: {context}\n\nUser Question: {user_message}\n\nProvide a helpful, clear answer based on the shop data."
                    }
                ],
                temperature=0.7,
                max_tokens=1024
            )
            
            ai_response = response.choices[0].message.content
            
            # Extract simple insights
            insights = []
            if trends['fast_moving']:
                insights.append(f"{list(trends['fast_moving'].keys())[0]} is your most popular item")
            
            return {
                'response': ai_response,
                'insights': insights,
                'recommendations': recommendations[:3]
            }
        except Exception as e:
            return {
                'response': f"I encountered an error while connecting to Groq: {str(e)}. Please check your 'notable' API key configuration.",
                'insights': [],
                'recommendations': recommendations[:3]
            }
