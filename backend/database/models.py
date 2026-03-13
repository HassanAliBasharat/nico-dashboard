from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from backend.database.db import Base

class DryfruitPrice(Base):
    __tablename__ = "dryfruit_prices"

    id             = Column(Integer, primary_key=True, index=True)
    product        = Column(String(100), nullable=False)
    price          = Column(Numeric(10, 2), nullable=False)
    currency       = Column(String(10), default='USD')
    country        = Column(String(100))
    source         = Column(String(200))
    date_collected = Column(DateTime, server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)