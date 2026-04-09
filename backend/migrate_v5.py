from sqlalchemy import text, inspect
from app.database import engine, Base
from app.models import Sale, ShopProfile

def run_migration():
    print("Starting database migration...")
    
    # 1. Create all missing tables (like shop_profiles)
    Base.metadata.create_all(bind=engine)
    print("Tables initialized.")

    inspector = inspect(engine)
    
    try:
        with engine.begin() as conn:
            # 2. Update items
            if 'items' in inspector.get_table_names():
                columns = [c['name'] for c in inspector.get_columns('items')]
                if 'selling_price' not in columns:
                    print("Adding 'selling_price' to 'items'...")
                    conn.execute(text("ALTER TABLE items ADD COLUMN selling_price FLOAT DEFAULT 0.0"))
                if 'cost_price' not in columns:
                    print("Adding 'cost_price' to 'items'...")
                    conn.execute(text("ALTER TABLE items ADD COLUMN cost_price FLOAT DEFAULT 0.0"))
                if 'updated_at' not in columns:
                    print("Adding 'updated_at' to 'items'...")
                    conn.execute(text("ALTER TABLE items ADD COLUMN updated_at TIMESTAMP"))

            # 3. Update shops
            if 'shops' in inspector.get_table_names():
                columns = [c['name'] for c in inspector.get_columns('shops')]
                if 'pin_hash' not in columns:
                    print("Adding 'pin_hash' to 'shops'...")
                    conn.execute(text("ALTER TABLE shops ADD COLUMN pin_hash VARCHAR"))

            # 4. Update sales
            if 'sales' in inspector.get_table_names():
                columns = [c['name'] for c in inspector.get_columns('sales')]
                if 'recorded_by' not in columns:
                    print("Adding 'recorded_by' to 'sales'...")
                    conn.execute(text("ALTER TABLE sales ADD COLUMN recorded_by VARCHAR"))
                    
    except Exception as e:
        print(f"Error during migration: {e}")

    print("Migration finished.")

if __name__ == "__main__":
    run_migration()
