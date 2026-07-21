from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class DryfruitPrice(Base):
    __tablename__ = "dryfruit_prices"
    id          = Column(Integer, primary_key=True, index=True)
    product     = Column(String, index=True)
    price_usd   = Column(Float)
    price_eur   = Column(Float, nullable=True)
    country     = Column(String, nullable=True)
    source      = Column(String, nullable=True)
    eu_low      = Column(Float, nullable=True)
    eu_high     = Column(Float, nullable=True)
    eu_avg      = Column(Float, nullable=True)
    scraped_at  = Column(DateTime, default=datetime.utcnow)
    notes       = Column(Text, nullable=True)

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role            = Column(String, default="visitor")  # "admin" or "visitor"
    created_at      = Column(DateTime, default=datetime.utcnow)