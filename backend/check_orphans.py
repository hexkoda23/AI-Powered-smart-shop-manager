import sqlite3
import os

db_path = 'shop.db'
if not os.path.exists(db_path):
    print(f"{db_path} not found")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Checking for orphaned sales...")
    cursor.execute("SELECT id, item_id FROM sales WHERE item_id NOT IN (SELECT id FROM items)")
    orphans = cursor.fetchall()
    print(f"Orphaned sales count: {len(orphans)}")
    for row in orphans:
        print(row)
        
    conn.close()
