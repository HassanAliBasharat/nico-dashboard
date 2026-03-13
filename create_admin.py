from backend.database.db import SessionLocal
from backend.database.models import User
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"])
db = SessionLocal()

existing = db.query(User).filter(User.username == "admin").first()
if existing:
    print("Admin already exists!")
else:
    user = User(username="admin", hashed_password=pwd.hash("nico1234"))
    db.add(user)
    db.commit()
    print("Admin created!")

db.close()
