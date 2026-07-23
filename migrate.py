import os
os.environ["DATABASE_URL"] = "postgresql://postgres:prAncualhYxzEOmiifRnVcmcWhYqAThX@shortline.proxy.rlwy.net:31949/railway"

from backend.database.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'admin'"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()"))
    conn.execute(text("UPDATE users SET role='admin' WHERE username='admin'"))
    conn.commit()
    result = conn.execute(text("SELECT username, role FROM users"))
    for row in result:
        print(row)
    print("Done")
