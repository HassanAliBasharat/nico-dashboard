from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database.models import DryfruitPrice
from datetime import datetime

def get_all_prices(db: Session):
    return db.query(DryfruitPrice).order_by(
        desc(DryfruitPrice.date_collected)
    ).limit(500).all()

def get_prices_by_product(db: Session, product: str):
    return db.query(DryfruitPrice).filter(
        DryfruitPrice.product.ilike(f'%{product}%')
    ).order_by(
        desc(DryfruitPrice.date_collected)
    ).all()

def insert_price(db: Session, product, price, currency, country, source):
    entry = DryfruitPrice(
        product=product,
        price=float(price),
        currency=currency,
        country=country,
        source=source,
        date_collected=datetime.utcnow()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry