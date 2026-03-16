import sqlite3

def run_migration():
    conn = sqlite3.connect('shop.db')
    cursor = conn.cursor()
    
    # Try adding cost_price and selling_price to items
    try:
        cursor.execute("ALTER TABLE items ADD COLUMN selling_price FLOAT DEFAULT 0.0")
        print("Added selling_price column to items")
    except sqlite3.OperationalError as e:
        print(f"selling_price column already exists or error: {e}")
        
    try:
        cursor.execute("ALTER TABLE items ADD COLUMN cost_price FLOAT DEFAULT 0.0")
        print("Added cost_price column to items")
    except sqlite3.OperationalError as e:
        print(f"cost_price column already exists or error: {e}")

    conn.commit()
    conn.close()
    
if __name__ == "__main__":
    run_migration()
