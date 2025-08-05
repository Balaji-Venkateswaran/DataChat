import sqlite3

DB_PATH = "file_data.db"

def get_connection():
    return sqlite3.connect(DB_PATH)

def initialize_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT,
        filepath TEXT,
        filetype TEXT,
        columns TEXT,
        content_text TEXT,
        embedding TEXT,
        uploaded_at TEXT,
        created_at TEXT
    )
    """)
    conn.commit()
    conn.close()
