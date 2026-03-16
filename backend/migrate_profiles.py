import sqlite3

def run_migration():
    conn = sqlite3.connect('shop.db')
    cursor = conn.cursor()

    try:
        # Create shop_profiles table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shop_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shop_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops (id)
            )
        ''')
        print("Created shop_profiles table.")

        # Add recorded_by to sales
        cursor.execute('ALTER TABLE sales ADD COLUMN recorded_by VARCHAR')
        print("Added recorded_by column to sales.")
        
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e).lower():
            print("Column recorded_by already exists in sales.")
        else:
            print(f"Error during migration: {e}")
            conn.rollback()
            return
    except Exception as e:
        print(f"Unexpected error: {e}")
        conn.rollback()
        return

    conn.commit()
    conn.close()
    print("Migration successful.")

if __name__ == "__main__":
    run_migration()
