import os
import threading
import hashlib
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc
from jose import jwt, JWTError
from datetime import datetime, timedelta

# ─── Load .env file when running locally ───────────────────────────────────────
# On Railway, environment variables are injected automatically — load_dotenv()
# simply does nothing when the variables are already set, so this is always safe.
load_dotenv()

from backend.database.db import get_db, engine
from backend.database.models import Base, DryfruitPrice, User
from backend.services.price_service import get_all_prices, get_prices_by_product

Base.metadata.create_all(bind=engine)

# ─── Settings — read from environment, fall back to local defaults ──────────────
#
#   LOCAL  → uses the fallback values on the right side of the comma
#   RAILWAY → uses the environment variables you set in Railway dashboard
#
SECRET_KEY = os.environ.get("SECRET_KEY", "nico-secret-key-2024")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ─── CORS — allowed origins ─────────────────────────────────────────────────────
#
#   LOCAL  → allows localhost:3000 (your React dev server)
#   RAILWAY → add your Vercel URL as ALLOWED_ORIGIN environment variable
#             e.g.  ALLOWED_ORIGIN=https://nico-dashboard.vercel.app
#
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")

ALL_PRODUCTS = ["almond", "cashew", "pistachio", "walnut", "raisin", "date", "dried_fig", "dried_apricot"]

app = FastAPI(title="NICO Price Intelligence", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        ALLOWED_ORIGIN,          # your Vercel URL (set via Railway env variable)
        "http://localhost:3000",  # always allow local dev regardless
        "http://localhost:3001",  # React sometimes uses 3001 if 3000 is busy
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth helpers ────────────────────────────────────────────────────────────────

def verify_password(plain, hashed):
    return hashlib.sha256(plain.encode()).hexdigest() == hashed

def create_token(data):
    to_encode = {**data, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(User).filter(User.username == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Routes ──────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "NICO API v4 running", "products": ALL_PRODUCTS}

@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_token({"sub": user.username}), "token_type": "bearer"}

@app.get("/prices")
def read_prices(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_all_prices(db)

@app.get("/prices/latest")
def latest_prices(db: Session = Depends(get_db), _=Depends(get_current_user)):
    result = {}
    for p in ALL_PRODUCTS:
        row = db.query(DryfruitPrice).filter(DryfruitPrice.product == p)\
                .order_by(desc(DryfruitPrice.date_collected)).first()
        if row:
            result[p] = {"price": float(row.price), "currency": row.currency,
                         "country": row.country, "source": row.source,
                         "date": row.date_collected.isoformat()}
    return result

@app.get("/prices/{product}")
def product_prices(product: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = get_prices_by_product(db, product)
    if not rows:
        raise HTTPException(status_code=404, detail="No data for this product")
    return rows

@app.get("/history/{product}")
def price_history(product: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(DryfruitPrice).filter(DryfruitPrice.product == product)\
             .order_by(DryfruitPrice.date_collected).limit(200).all()
    return [{"date": r.date_collected.isoformat(), "price": float(r.price),
             "country": r.country, "source": r.source} for r in rows]

@app.get("/market-summary")
def market_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    summary = {}
    for p in ALL_PRODUCTS:
        rows = db.query(DryfruitPrice).filter(DryfruitPrice.product == p)\
                 .order_by(desc(DryfruitPrice.date_collected)).limit(30).all()
        if rows:
            prices = [float(r.price) for r in rows]
            prev = float(rows[1].price) if len(rows) > 1 else prices[0]
            change = round(((prices[0] - prev) / prev) * 100, 1) if prev else 0
            summary[p] = {
                "latest": prices[0], "avg": round(sum(prices)/len(prices), 2),
                "min": round(min(prices), 2), "max": round(max(prices), 2),
                "change_pct": change, "count": len(prices),
                "country": rows[0].country, "source": rows[0].source
            }
    return summary

@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db), _=Depends(get_current_user)):
    alerts = []
    for p in ALL_PRODUCTS:
        rows = db.query(DryfruitPrice).filter(DryfruitPrice.product == p)\
                 .order_by(desc(DryfruitPrice.date_collected)).limit(10).all()
        if len(rows) >= 2:
            curr, prev = float(rows[0].price), float(rows[1].price)
            pct = round(((curr - prev) / prev) * 100, 2) if prev else 0
            if abs(pct) >= 3:
                alerts.append({
                    "product": p, "current": curr, "previous": prev,
                    "change_pct": pct, "direction": "UP" if pct > 0 else "DOWN",
                    "severity": "HIGH" if abs(pct) >= 10 else "MEDIUM",
                    "message": f"{p.replace('_',' ').title()} {'rose' if pct>0 else 'dropped'} {abs(pct):.1f}%"
                })
    return alerts

@app.get("/predict/{product}")
def predict(product: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(DryfruitPrice).filter(DryfruitPrice.product == product)\
             .order_by(DryfruitPrice.date_collected).limit(60).all()
    if len(rows) < 5:
        raise HTTPException(status_code=400, detail="Need at least 5 data points")
    prices = [float(r.price) for r in rows]
    n = len(prices)
    xm = (n-1)/2; ym = sum(prices)/n
    num = sum((i-xm)*(prices[i]-ym) for i in range(n))
    den = sum((i-xm)**2 for i in range(n))
    slope = num/den if den else 0
    intercept = ym - slope*xm
    base = datetime.utcnow()
    forecast = [{"day": d, "date": (base+timedelta(days=d)).strftime("%Y-%m-%d"),
                 "price": round(max(0.1, intercept + slope*(n+d-1)), 2)}
                for d in range(1, 31)]
    return {"product": product, "current": prices[-1], "trend": "UP" if slope>0 else "DOWN",
            "slope": round(slope, 4), "forecast": forecast}

# ─── Background scraper ──────────────────────────────────────────────────────────

scrape_status = {"running": False, "last_run": None, "last_result": None, "error": None}

def run_scraper_background():
    global scrape_status
    scrape_status["running"] = True
    scrape_status["error"] = None
    try:
        from backend.scrapers.multi_source_scraper import run
        total = run()
        scrape_status["last_result"] = f"{total} prices saved"
        scrape_status["last_run"] = datetime.utcnow().isoformat()
    except Exception as e:
        scrape_status["error"] = str(e)
        print(f"Scraper error: {e}")
    finally:
        scrape_status["running"] = False

@app.post("/scrape")
def trigger_scrape(_=Depends(get_current_user)):
    global scrape_status
    if scrape_status["running"]:
        return {"status": "already_running", "message": "Scraper is already running"}
    thread = threading.Thread(target=run_scraper_background, daemon=True)
    thread.start()
    return {"status": "started", "message": "Scraper running in background", "timestamp": datetime.utcnow().isoformat()}

@app.get("/scrape/status")
def get_scrape_status(_=Depends(get_current_user)):
    return scrape_status