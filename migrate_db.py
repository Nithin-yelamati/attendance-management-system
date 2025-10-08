"""
Database migration script to add face_encoding column to Student table
"""
import sqlite3
import os

# Path to database
db_path = 'instance/attendance.db'

# Check if database exists
if not os.path.exists(db_path):
    print("Database doesn't exist yet. It will be created when you run the app.")
    exit(0)

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if face_encoding column exists
    cursor.execute("PRAGMA table_info(student)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'face_encoding' not in columns:
        print("Adding face_encoding column to student table...")
        cursor.execute("ALTER TABLE student ADD COLUMN face_encoding BLOB")
        conn.commit()
        print("✓ Successfully added face_encoding column!")
    else:
        print("✓ face_encoding column already exists!")
        
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    conn.close()

print("\nDatabase migration complete!")
