import os
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from groq import Groq
from google.cloud import firestore
from dotenv import load_dotenv

load_dotenv()

groq_api_key = os.getenv("notable")
client = Groq(api_key=groq_api_key) if groq_api_key else None


class AIService:
    def __init__(self, db: firestore.Client):
        self.db = db

    def get_sales_data(self, shop_id: str, days: int = 30) -> pd.DataFrame:
        """Fetch sales data for analysis"""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        sales_docs = self.db.collection('sales')\
            .where('shop_id', '==', shop_id)\
            .where('sale_date', '>=', cutoff_date)\
            .get()
        
        data = []
        for doc in sales_docs:
            sale = doc.to_dict()
            # We might need to fetch item cost price if not in sale doc
            # For simplicity, we assume we might need a join or map
            data.append({
                'item_name': sale.get('item_name'),
                'quantity': sale.get('quantity'),
                'selling_price': sale.get('selling_price'),
                'sale_date': sale.get('sale_date'),
                'profit': 0 # Will be calculated if item cost is available
            })
        
        return pd.DataFrame(data)

    def get_stock_data(self, shop_id: str) -> pd.DataFrame:
        """Fetch current stock data"""
        items_docs = self.db.collection('items').where('shop_id', '==', shop_id).get()
        data = []
        for doc in items_docs:
            item = doc.to_dict()
            data.append({
                'item_name': item.get('name'),
                'current_stock': item.get('current_stock'),
                'low_stock_threshold': item.get('low_stock_threshold'),
                'is_low_stock': item.get('current_stock', 0) <= item.get('low_stock_threshold', 2)
            })
        
        return pd.DataFrame(data)

    def analyze_trends(self, shop_id: str) -> Dict:
        """Analyze sales trends and patterns"""
        sales_df = self.get_sales_data(shop_id, 30)
        
        if sales_df.empty:
            return {
                'fast_moving': [],
                'slow_moving': [],
                'high_profit': [],
                'trends': []
            }
        
        # Fast moving items
        fast_moving = sales_df.groupby('item_name')['quantity'].sum().sort_values(ascending=False).head(5)
        
        return {
            'fast_moving': fast_moving.to_dict(),
            'total_sales_30d': sales_df['quantity'].sum()
        }

    def generate_restock_recommendations(self, shop_id: str) -> List[str]:
        """Generate smart restock recommendations"""
        stock_df = self.get_stock_data(shop_id)
        recommendations = []
        
        low_stock = stock_df[stock_df['is_low_stock']]
        for _, item in low_stock.iterrows():
            recommendations.append(f"{item['item_name']} is running low ({item['current_stock']} left). Restock soon.")
        
        return recommendations

    def chat(self, user_message: str, shop_id: str) -> Dict:
        """Handle AI chat queries"""
        # Get context data
        trends = self.analyze_trends(shop_id)
        recommendations = self.generate_restock_recommendations(shop_id)
        
        # Prepare context for AI
        shop_doc = self.db.collection('shops').document(shop_id).get()
        shop_name = shop_doc.to_dict().get("name") if shop_doc.exists else "Unknown Shop"
        
        context = f"""
        Shop Name: {shop_name}
        Fast moving items: {trends.get('fast_moving', {})}
        Current stock situation: {len(recommendations)} items need attention.
        Top 3 restock recommendations: {', '.join(recommendations[:3])}
        """
        
        if not client:
            return {
                'response': f"Based on your shop data: {user_message}. (AI processing requires a valid Groq key)",
                'insights': [],
                'recommendations': recommendations[:3]
            }

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful shop assistant AI for 'Notable'. Use Naira (₦) for currency."
                    },
                    {
                        "role": "user",
                        "content": f"Context: {context}\n\nUser Question: {user_message}"
                    }
                ],
                temperature=0.7,
                max_tokens=1024
            )
            
            ai_response = response.choices[0].message.content
            return {
                'response': ai_response,
                'insights': [],
                'recommendations': recommendations[:3]
            }
        except Exception as e:
            return {
                'response': f"AI Error: {str(e)}",
                'insights': [],
                'recommendations': recommendations[:3]
            }
