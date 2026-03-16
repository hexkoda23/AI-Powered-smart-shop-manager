from sqlalchemy import text, inspect
from app.database import engine, Base
from app.models import Sale, ShopProfile

def run_migration():
    print("Starting database migration...")
    
    # 1. Create all missing tables (like shop_profiles)
    Base.metadata.create_all(bind=engine)
    print("Tables initialized.")

    # 2. Add recorded_by to sales if missing
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('sales')]
    
    if 'recorded_by' not in columns:
        print("Adding 'recorded_by' column to 'sales' table...")
        with engine.connect() as conn:
            try:
                # Using generic SQL that works for both PostgreSQL and SQLite
                conn.execute(text("ALTER TABLE sales ADD COLUMN recorded_by VARCHAR"))
                conn.commit()
                print("Column 'recorded_by' added successfully.")
            except Exception as e:
                print(f"Error adding column: {e}")
                conn.rollback()
    else:
        print("Column 'recorded_by' already exists in 'sales' table.")

    print("Migration finished.")

if __name__ == "__main__":
    run_migration()
