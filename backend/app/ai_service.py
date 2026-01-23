import os
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Sale, Item
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


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

    def chat(self, user_message: str) -> Dict:
        """Handle AI chat queries"""
        # Get context data
        trends = self.analyze_trends()
        stock_df = self.get_stock_data()
        sales_df = self.get_sales_data(30)
        recommendations = self.generate_restock_recommendations()
        
        # Prepare context for AI
        context = f"""
        Shop Management System Data:
        
        Sales Trends (Last 30 days):
        - Fast-moving items: {list(trends['fast_moving'].keys())[:5]}
        - High profit items: {list(trends['high_profit'].keys())[:5]}
        - Total profit: ${trends['total_profit_30d']:.2f}
        - Total items sold: {trends['total_sales_30d']}
        
        Current Stock Status:
        - Low stock items: {list(stock_df[stock_df['is_low_stock']]['item_name'])}
        
        Restock Recommendations:
        {chr(10).join(recommendations[:5])}
        """
        
        if not sales_df.empty:
            context += f"""
        
        Recent Sales Data (sample):
        {sales_df.head(10).to_string()}
        """
        
        if not client:
            # Fallback response when OpenAI API key is not configured
            insights = []
            if trends['fast_moving']:
                top_item = list(trends['fast_moving'].keys())[0]
                insights.append(f"{top_item} is your best-selling item")
            
            if trends['high_profit']:
                top_profit = list(trends['high_profit'].keys())[0]
                insights.append(f"{top_profit} generates the most profit")
            
            return {
                'response': f"Based on your shop data: {user_message}. Please configure your OpenAI API key for more detailed AI-powered insights.",
                'insights': insights,
                'recommendations': recommendations[:3]
            }
        
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a helpful shop assistant AI. You help shop owners understand their business through simple, clear language. 
                        You analyze sales data, stock levels, and provide actionable insights. Always be friendly, concise, and practical.
                        Focus on what matters: what to restock, what's selling well, and profit insights."""
                    },
                    {
                        "role": "user",
                        "content": f"Context: {context}\n\nUser Question: {user_message}\n\nProvide a helpful, clear answer based on the shop data."
                    }
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content
            
            # Extract insights and recommendations
            insights = []
            if trends['fast_moving']:
                top_item = list(trends['fast_moving'].keys())[0]
                insights.append(f"{top_item} is your best-selling item")
            
            if trends['high_profit']:
                top_profit = list(trends['high_profit'].keys())[0]
                insights.append(f"{top_profit} generates the most profit")
            
            return {
                'response': ai_response,
                'insights': insights,
                'recommendations': recommendations[:3]
            }
        except Exception as e:
            return {
                'response': f"I encountered an error: {str(e)}. Please check your OpenAI API key configuration.",
                'insights': [],
                'recommendations': recommendations[:3]
            }
