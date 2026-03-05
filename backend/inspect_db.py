import sqlite3
import os

db_path = 'shop.db'
if not os.path.exists(db_path):
    print(f"{db_path} not found")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- SHOPS ---")
    cursor.execute("SELECT id, name FROM shops")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- ITEMS ---")
    cursor.execute("SELECT id, name, shop_id, cost_price, unit_price FROM items LIMIT 5")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- SALES ---")
    cursor.execute("SELECT id, item_id, shop_id, quantity, selling_price FROM sales LIMIT 5")
    for row in cursor.fetchall():
        print(row)
        
    conn.close()
