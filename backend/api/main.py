import os
import threading
import hashlib
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
import smtplib, secrets, string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ─── Load .env file when running locally ───────────────────────────────────────
# On Railway, environment variables are injected automatically — load_dotenv()
# simply does nothing when the variables are already set, so this is always safe.
load_dotenv()

from backend.database.db import get_db, engine
from backend.database.models import Base, DryfruitPrice, User
from backend.services.price_service import get_all_prices, get_prices_by_product

# ─── Intelligence modules (new) ──────────────────────────────────────────────
INTELLIGENCE_AVAILABLE = False
try:
    from backend.services.risk_engine import calculate_risk, get_latest_risk
    from backend.services.forecast_engine import generate_forecast
    from backend.services.substitution_engine import get_substitutes, calculate_opportunity
    from backend.services.llm_layer import explain_risk, explain_forecast, generate_opportunity_narrative
    from backend.database.models_intelligence import (
        RiskSignal, WeatherEvent, ForecastFeature, ProductSubstitute, OpportunityFlag
    )
    INTELLIGENCE_AVAILABLE = True
    print("Intelligence modules loaded OK")
except Exception as _ie:
    print(f"Intelligence modules not loaded (non-critical): {_ie}")
    INTELLIGENCE_AVAILABLE = False

Base.metadata.create_all(bind=engine)

# Create intelligence tables if intelligence modules are loaded
if INTELLIGENCE_AVAILABLE:
    try:
        from backend.database.models_intelligence import Base as IntelBase
        IntelBase.metadata.create_all(bind=engine)
        print("Intelligence tables created OK")
    except Exception as _e:
        print(f"Intelligence table creation (non-critical): {_e}")

# ─── Settings — read from environment, fall back to local defaults ──────────────
#
#   LOCAL  → uses the fallback values on the right side of the comma
#   RAILWAY → uses the environment variables you set in Railway dashboard
#
SECRET_KEY = os.environ.get("SECRET_KEY", "nico-secret-key-2024")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ─── CORS — allow all Vercel preview URLs + localhost automatically ──────────────
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

ALL_PRODUCTS = ["almond", "cashew", "pistachio", "walnut", "raisin", "date", "dried_fig", "dried_apricot"]

app = FastAPI(title="NICO Price Intelligence", version="4.0.0")

# Accept any *.vercel.app origin + localhost — no env variable needed
class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        origin = request.headers.get("origin", "")
        allowed = (
            origin.endswith(".vercel.app") or
            origin.endswith(".caspiannuts.com") or
            origin == "https://caspiannuts.com" or
            origin.startswith("http://localhost") or
            origin.startswith("https://localhost")
        )
        if request.method == "OPTIONS":
            from starlette.responses import Response as SR
            r = SR()
            if allowed:
                r.headers["Access-Control-Allow-Origin"] = origin
            r.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            r.headers["Access-Control-Allow-Headers"] = "*"
            r.headers["Access-Control-Allow-Credentials"] = "true"
            return r
        response = await call_next(request)
        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.add_middleware(DynamicCORSMiddleware)

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

@app.get("/ping")
def ping():
    return {"status": "ok"}

# ─── Keep-alive: self-ping every 10 min to prevent Railway from sleeping ─────
def _keep_alive():
    import time, httpx
    port = int(os.environ.get("PORT", 8000))
    url = f"http://localhost:{port}/ping"
    while True:
        time.sleep(600)
        try:
            httpx.get(url, timeout=5)
        except Exception:
            pass

threading.Thread(target=_keep_alive, daemon=True).start()


# ─── Visitor Registration Models ─────────────────────────────────────────────
class VisitorRegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""

class WordPressWebhookPayload(BaseModel):
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""
    source: str = "wordpress"

# ─── Email helper ─────────────────────────────────────────────────────────────
def send_nico_welcome_email(email: str, password: str, first_name: str = ""):
    """Send NICO welcome email via Resend API."""
    import urllib.request, json as _json
    api_key = os.getenv("SMTP_PASS", "")
    from_email = os.getenv("FROM_EMAIL", "noreply@caspiannuts.nl")
    if not api_key:
        print("Resend API key not configured — skipping welcome email")
        return
    try:
        name = first_name or "there"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#1E40AF;font-size:28px;margin:0;">NICO</h1>
            <p style="color:#6B7280;font-size:13px;margin:4px 0 0;">Price Intelligence Dashboard</p>
          </div>
          <div style="background:#fff;border-radius:10px;padding:28px;border:1px solid #E5E7EB;">
            <p style="color:#374151;font-size:15px;">Hi {name},</p>
            <p style="color:#374151;font-size:14px;">Welcome to Caspian Nuts! Your NICO dashboard access is ready.</p>
            <p style="color:#374151;font-size:14px;">Monitor live market prices, product catalogs and weather forecasts for all our products.</p>
            <div style="background:#EFF6FF;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #BFDBFE;">
              <p style="margin:0 0 8px;color:#1E40AF;font-weight:700;font-size:13px;">Your Login Details</p>
              <p style="margin:4px 0;color:#374151;font-size:13px;"><strong>URL:</strong> <a href="https://forecast.caspiannuts.com" style="color:#2563EB;">forecast.caspiannuts.com</a></p>
              <p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Email:</strong> {email}</p>
              <p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Password:</strong> {password}</p>
            </div>
            <p style="color:#6B7280;font-size:12px;">This is the same password you use on caspiannuts.nl. If you change your password there, update it here too.</p>
            <div style="text-align:center;margin-top:24px;">
              <a href="https://forecast.caspiannuts.com" style="background:#1E40AF;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Open NICO Dashboard</a>
            </div>
          </div>
          <p style="text-align:center;color:#9CA3AF;font-size:11px;margin-top:20px;">Caspian Nuts B.V. · caspiannuts.nl</p>
        </div>
        """
        payload = _json.dumps({
            "from": f"Caspian Nuts <{from_email}>",
            "to": [email],
            "subject": "Your NICO Price Intelligence Access",
            "html": html
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            result = _json.loads(resp.read())
            print(f"Welcome email sent to {email}, id: {result.get('id')}")
    except Exception as e:
        print(f"Email send failed: {e}")

# ─── WordPress Webhook — called when user registers on caspiannuts.nl ─────────
@app.post("/webhook/wordpress-register")
async def wordpress_register_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Accepts any format WordPress sends — parses body flexibly.
    WP Webhooks sends user data in various formats depending on configuration.
    """
    import json as _json
    try:
        body = await request.body()
        # Try JSON first
        try:
            data = _json.loads(body)
        except Exception:
            # Try form data
            from urllib.parse import parse_qs
            parsed = parse_qs(body.decode("utf-8"))
            data = {k: v[0] for k, v in parsed.items()}

        print(f"Webhook received: {_json.dumps(data)[:500]}")

        # Extract email — WP Webhooks sends it as user_email or email
        email = (
            data.get("user_email") or
            data.get("email") or
            data.get("Email") or
            data.get("USER_EMAIL") or ""
        ).lower().strip()

        # Extract password — sent as user_pass or password
        password = (
            data.get("user_pass") or
            data.get("password") or
            data.get("Password") or
            data.get("USER_PASS") or ""
        ).strip()

        # Extract name
        first_name = (
            data.get("first_name") or
            data.get("user_firstname") or
            data.get("display_name") or
            data.get("user_nicename") or ""
        ).strip()

        if not email:
            print(f"No email found in payload: {data}")
            return {"status": "error", "message": "No email in payload", "received": data}

        if not password:
            # If no password sent, create a temporary one from email
            import secrets
            password = secrets.token_urlsafe(10)
            print(f"No password in payload, generated one for {email}")

        # Check if already exists
        existing = db.query(User).filter(User.username == email).first()
        if existing:
            return {"status": "exists", "message": f"User {email} already has NICO access"}

        # Create visitor account
        hashed = hashlib.sha256(password.encode()).hexdigest()
        new_user = User(username=email, hashed_password=hashed, role="visitor")
        db.add(new_user)
        db.commit()

        # Send welcome email in background
        background_tasks.add_task(send_nico_welcome_email, email, password, first_name)
        return {"status": "created", "message": f"Visitor account created for {email}"}

    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ─── Manual visitor registration (fallback) ───────────────────────────────────
@app.post("/register/visitor")
def register_visitor(
    payload: VisitorRegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manual visitor registration endpoint."""
    username = payload.email.lower().strip()
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account already exists")
    hashed = hashlib.sha256(payload.password.encode()).hexdigest()
    new_user = User(username=username, hashed_password=hashed, role="visitor")
    db.add(new_user)
    db.commit()
    background_tasks.add_task(send_nico_welcome_email, payload.email, payload.password, payload.first_name)
    return {"status": "created", "message": "Visitor account created"}

# ─── Get current user role (used by frontend) ─────────────────────────────────
@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": getattr(current_user, "role", "admin")
    }


@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    role = getattr(user, "role", "admin"); return {"access_token": create_token({"sub": user.username, "role": role}), "token_type": "bearer", "role": role}

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

# ═══════════════════════════════════════════════════════════════════════════
# INTELLIGENCE API ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/risk/{product_id}")
def get_risk(product_id: str, _=Depends(get_current_user)):
    """
    Supply risk score for a product.
    Checks DB cache first (6hr TTL), recalculates if stale.
    Returns: risk_score (0-100), availability (LOW/NORMAL/HIGH),
             triggered_events, explanation, crop_stage
    """
    if not INTELLIGENCE_AVAILABLE:
        return {"product_id": product_id, "risk_score": 10, "availability": "NORMAL",
                "triggered_events": [], "explanation": "Intelligence module not available.", "crop_stage": "unknown"}
    # Try cache first
    cached = get_latest_risk(product_id)
    if cached:
        return cached
    # Recalculate
    result = calculate_risk(product_id, save_to_db=True)
    # Enrich with LLM explanation
    result["explanation"] = explain_risk(
        product_id, result["risk_score"],
        result.get("triggered_events", []),
        result["availability"],
        result.get("crop_stage", "unknown")
    )
    return result


@app.get("/forecast/{product_id}")
def get_forecast(product_id: str, _=Depends(get_current_user)):
    """
    Hybrid price forecast for a product (30-day horizon).
    Uses LightGBM if ≥20 data points, otherwise enhanced linear.
    Returns: base_forecast, adjusted_forecast, forecast_low/high,
             confidence_score, trend, main_drivers, change_pct
    """
    if not INTELLIGENCE_AVAILABLE:
        return {"product_id": product_id, "adjusted_forecast": None,
                "confidence_score": 0, "trend": "STABLE",
                "explanation": "Intelligence module not available."}
    # Get current risk to feed into forecast
    risk = calculate_risk(product_id, save_to_db=False)
    risk_score = risk.get("risk_score", 10)
    risk_events = risk.get("triggered_events", [])

    result = generate_forecast(product_id, risk_score=risk_score,
                               risk_events=risk_events, save_to_db=True)
    # Add LLM explanation
    result["explanation"] = explain_forecast(
        product_id,
        result.get("base_forecast", 0),
        result.get("adjusted_forecast", 0),
        result.get("change_pct", 0),
        result.get("trend", "STABLE"),
        result.get("main_drivers", [])
    )
    return result


@app.get("/opportunity/{product_id}")
def get_opportunity(product_id: str, _=Depends(get_current_user)):
    """
    Purchasing opportunity recommendation for a product.
    Returns: opportunity_score, recommended_action, action_label,
             urgency, explanation, narrative
    """
    if not INTELLIGENCE_AVAILABLE:
        return {"product_id": product_id, "recommended_action": "WAIT",
                "action_label": "Intelligence module not available.", "opportunity_score": 0}
    # Compute fresh risk + forecast
    risk = calculate_risk(product_id, save_to_db=False)
    forecast = generate_forecast(
        product_id,
        risk_score=risk.get("risk_score", 10),
        risk_events=risk.get("triggered_events", []),
        save_to_db=False
    )
    subs = get_substitutes(product_id, risk.get("risk_score", 10))
    top_sub = subs[0] if subs else None

    result = calculate_opportunity(
        product_id=product_id,
        risk_score=risk.get("risk_score", 10),
        forecast_change_pct=forecast.get("change_pct", 0),
        availability=risk.get("availability", "NORMAL"),
        triggered_events=risk.get("triggered_events", []),
        save_to_db=True
    )
    # Add LLM narrative
    result["narrative"] = generate_opportunity_narrative(
        product_id,
        result["recommended_action"],
        result["urgency"],
        result["explanation"],
        substitute_label=top_sub.get("substitute_label") if top_sub else None
    )
    result["forecast"] = forecast
    result["risk"] = risk
    return result


@app.get("/substitutes/{product_id}")
def get_substitutes_route(product_id: str, _=Depends(get_current_user)):
    """
    Alternative sourcing options for a product.
    When supply is stressed, returns alternatives ranked by availability + price.
    """
    if not INTELLIGENCE_AVAILABLE:
        return {"product_id": product_id, "substitutes": []}
    risk = calculate_risk(product_id, save_to_db=False)
    subs = get_substitutes(product_id, risk.get("risk_score", 10))
    return {
        "product_id":   product_id,
        "risk_score":   risk.get("risk_score", 10),
        "availability": risk.get("availability", "NORMAL"),
        "substitutes":  subs,
    }


@app.get("/intelligence/{product_id}")
def get_full_intelligence(product_id: str, _=Depends(get_current_user)):
    """
    Full intelligence bundle for a product in one call.
    Used by frontend Analytics page to load all intelligence data at once.
    Returns: risk, forecast, opportunity, substitutes, explanation
    """
    if not INTELLIGENCE_AVAILABLE:
        return {"product_id": product_id, "available": False}

    risk     = calculate_risk(product_id, save_to_db=True)
    forecast = generate_forecast(
        product_id,
        risk_score=risk.get("risk_score", 10),
        risk_events=risk.get("triggered_events", []),
        save_to_db=True
    )
    opportunity = calculate_opportunity(
        product_id=product_id,
        risk_score=risk.get("risk_score", 10),
        forecast_change_pct=forecast.get("change_pct", 0),
        availability=risk.get("availability", "NORMAL"),
        triggered_events=risk.get("triggered_events", []),
        save_to_db=True
    )
    subs = get_substitutes(product_id, risk.get("risk_score", 10))

    # LLM enrichment
    risk["explanation"]         = explain_risk(product_id, risk["risk_score"],
                                               risk.get("triggered_events", []),
                                               risk["availability"],
                                               risk.get("crop_stage", "unknown"))
    forecast["explanation"]     = explain_forecast(product_id,
                                                   forecast.get("base_forecast", 0),
                                                   forecast.get("adjusted_forecast", 0),
                                                   forecast.get("change_pct", 0),
                                                   forecast.get("trend", "STABLE"),
                                                   forecast.get("main_drivers", []))
    opportunity["narrative"]    = generate_opportunity_narrative(
        product_id, opportunity["recommended_action"], opportunity["urgency"],
        opportunity["explanation"],
        substitute_label=subs[0].get("substitute_label") if subs else None
    )

    return {
        "product_id":   product_id,
        "available":    True,
        "risk":         risk,
        "forecast":     forecast,
        "opportunity":  opportunity,
        "substitutes":  subs[:3],
    }


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