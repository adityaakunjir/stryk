import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "stryk.db")
    print(f"Migrating database at {db_path}...")
    
    if not os.path.exists(db_path):
        print("Database file does not exist yet. It will be created on startup.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("matches_played", "INTEGER DEFAULT 0"),
        ("goals", "INTEGER DEFAULT 0"),
        ("assists", "INTEGER DEFAULT 0"),
        ("tackles", "INTEGER DEFAULT 0"),
        ("saves", "INTEGER DEFAULT 0"),
        ("intercepts", "INTEGER DEFAULT 0"),
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE players ADD COLUMN {col_name} {col_type}")
            print(f"Successfully added column: {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column '{col_name}' already exists.")
            else:
                print(f"Error adding '{col_name}': {e}")

    conn.commit()
    conn.close()
    print("Database migration completed.")

if __name__ == "__main__":
    migrate()
