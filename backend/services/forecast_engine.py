# backend/services/forecast_engine.py
# ═══════════════════════════════════════════════════════════════════════════════
# NICO Hybrid Forecasting Engine
#
# Architecture:
#   1. Pull historical prices from DB (last 90 days)
#   2. Build feature vector:
#      - price momentum (7d, 14d, 30d)
#      - seasonality (month, week of year)
#      - risk_score (from risk_engine)
#      - weather anomaly flag
#      - EU import price trend (from EU benchmarks)
#      - FX proxy (USD strength index via simple API)
#   3. Train LightGBM on available data (or fall back to weighted linear)
#   4. Produce: base_forecast, adjusted_forecast, confidence_score, low/high range
#
# NOTE: On Railway free tier, LightGBM trains fast (<1s) on 90 rows.
#       Model is retrained per product per request (stateless, no pickle needed).
# ═══════════════════════════════════════════════════════════════════════════════

import os, sys
import numpy as np
from datetime import datetime, timedelta
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.database.db import SessionLocal
from backend.database.models import DryfruitPrice
from backend.database.models_intelligence import ForecastFeature

# LightGBM is optional — falls back to weighted linear if not installed
try:
    import lightgbm as lgb
    LGBM_AVAILABLE = True
except ImportError:
    LGBM_AVAILABLE = False

# EU benchmark prices (EUR/kg) — used as target anchor
EU_BENCHMARKS = {
    "almond":          {"low": 5.80, "high": 7.20,  "avg": 6.50},
    "cashew":          {"low": 5.20, "high": 7.50,  "avg": 6.20},
    "pistachio":       {"low": 8.50, "high": 12.00, "avg": 9.80},
    "walnut":          {"low": 3.80, "high": 6.50,  "avg": 5.10},
    "raisin":          {"low": 1.80, "high": 3.00,  "avg": 2.35},
    "date":            {"low": 3.50, "high": 7.00,  "avg": 5.20},
    "dried_fig":       {"low": 2.50, "high": 4.80,  "avg": 3.60},
    "dried_apricot":   {"low": 3.20, "high": 6.50,  "avg": 4.80},
    "hazelnut":        {"low": 9.00, "high": 16.00, "avg": 12.00},
    "pecan":           {"low": 9.00, "high": 14.00, "avg": 11.50},
    "brazil_nut":      {"low": 10.50,"high": 14.00, "avg": 12.20},
    "macadamia":       {"low": 12.00,"high": 17.00, "avg": 14.00},
    "pine_nut":        {"low": 24.00,"high": 32.00, "avg": 27.50},
    "dried_mango":     {"low": 3.50, "high": 5.50,  "avg": 4.50},
    "dried_cranberry": {"low": 3.50, "high": 4.80,  "avg": 4.10},
    "dried_blueberry": {"low": 5.50, "high": 9.00,  "avg": 7.00},
    "banana_chip":     {"low": 2.80, "high": 4.00,  "avg": 3.40},
    "dried_apple":     {"low": 3.00, "high": 5.50,  "avg": 4.20},
    "dried_papaya":    {"low": 3.00, "high": 4.50,  "avg": 3.70},
    "prune":           {"low": 3.80, "high": 6.00,  "avg": 4.80},
}

# Seasonal price multipliers by month (1=Jan..12=Dec) per product group
SEASONAL_MULTIPLIERS = {
    "nuts":   [0.98, 0.97, 0.98, 1.00, 1.01, 1.02, 1.04, 1.06, 1.05, 1.02, 1.00, 0.99],
    "dried":  [1.00, 1.01, 1.00, 0.99, 0.98, 0.99, 1.01, 1.02, 1.01, 1.00, 0.99, 1.00],
}

NUT_PRODUCTS = {"almond","walnut","pistachio","cashew","hazelnut","pecan","brazil_nut","macadamia","pine_nut"}


def _get_prices(product_id: str, days: int = 90) -> list:
    """Fetch historical price records from DB."""
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        records = (
            db.query(DryfruitPrice)
            .filter(DryfruitPrice.product == product_id)
            .filter(DryfruitPrice.date_collected >= cutoff)
            .order_by(DryfruitPrice.date_collected.asc())
            .all()
        )
        return [{"price": float(r.price), "date": r.date_collected} for r in records]
    finally:
        db.close()


def _build_features(prices: list, risk_score: float, month: int, product_id: str) -> dict:
    """Build feature dict from price history and context."""
    if not prices:
        return {}

    vals = [p["price"] for p in prices]
    n = len(vals)

    # Price momentum
    last = vals[-1]
    avg_7  = np.mean(vals[-min(7, n):])
    avg_14 = np.mean(vals[-min(14, n):])
    avg_30 = np.mean(vals[-min(30, n):])
    avg_90 = np.mean(vals)

    mom_7  = (last - avg_7)  / avg_7  if avg_7  > 0 else 0
    mom_14 = (last - avg_14) / avg_14 if avg_14 > 0 else 0
    mom_30 = (last - avg_30) / avg_30 if avg_30 > 0 else 0

    # Volatility (std dev / mean)
    volatility = float(np.std(vals) / np.mean(vals)) if np.mean(vals) > 0 else 0

    # EU anchor
    eu = EU_BENCHMARKS.get(product_id, {})
    eu_avg = eu.get("avg", last)
    eu_distance = (last - eu_avg) / eu_avg if eu_avg > 0 else 0

    # Seasonality
    seasonal_group = "nuts" if product_id in NUT_PRODUCTS else "dried"
    seasonal_mult = SEASONAL_MULTIPLIERS[seasonal_group][month - 1]

    # Risk normalised 0–1
    risk_norm = risk_score / 100.0

    return {
        "last_price":    last,
        "avg_7":         avg_7,
        "avg_14":        avg_14,
        "avg_30":        avg_30,
        "avg_90":        avg_90,
        "mom_7":         mom_7,
        "mom_14":        mom_14,
        "mom_30":        mom_30,
        "volatility":    volatility,
        "eu_avg":        eu_avg,
        "eu_distance":   eu_distance,
        "seasonal_mult": seasonal_mult,
        "risk_norm":     risk_norm,
        "month":         month,
        "n_records":     n,
    }


def _linear_forecast(features: dict, horizon_days: int = 30) -> float:
    """Fallback: weighted linear regression on last prices."""
    last   = features["last_price"]
    mom_14 = features["mom_14"]
    mom_30 = features["mom_30"]
    seasonal_mult = features["seasonal_mult"]
    risk_norm = features["risk_norm"]

    # Base: extrapolate 30-day momentum
    trend_factor = 1 + (mom_14 * 0.6 + mom_30 * 0.4) * (horizon_days / 30)

    # Risk adjustment: high risk → higher expected price (supply squeeze)
    risk_adjustment = 1 + (risk_norm * 0.15)  # up to +15% for max risk

    return last * trend_factor * seasonal_mult * risk_adjustment


def _lgbm_forecast(prices: list, features: dict, horizon_days: int = 30) -> Optional[float]:
    """LightGBM multi-step forecast using sliding window."""
    if not LGBM_AVAILABLE or len(prices) < 20:
        return None

    vals = [p["price"] for p in prices]
    window = 14  # lookback window

    X, y = [], []
    for i in range(window, len(vals)):
        window_vals = vals[i - window:i]
        row = [
            np.mean(window_vals),
            np.std(window_vals),
            (window_vals[-1] - window_vals[0]) / window_vals[0] if window_vals[0] > 0 else 0,
            window_vals[-1],
            features.get("month", 6),
            features.get("seasonal_mult", 1.0),
            features.get("risk_norm", 0.0),
            features.get("eu_distance", 0.0),
        ]
        X.append(row)
        y.append(vals[i])

    if len(X) < 10:
        return None

    try:
        X_arr = np.array(X, dtype=np.float32)
        y_arr = np.array(y, dtype=np.float32)

        model = lgb.LGBMRegressor(
            n_estimators=100, learning_rate=0.1, num_leaves=8,
            min_child_samples=3, random_state=42, verbose=-1
        )
        model.fit(X_arr, y_arr)

        # Forecast: step forward horizon_days/7 times using last window
        current_window = list(vals[-window:])
        steps = max(1, horizon_days // 7)
        pred = features["last_price"]

        for _ in range(steps):
            row = np.array([[
                np.mean(current_window),
                np.std(current_window),
                (current_window[-1] - current_window[0]) / current_window[0] if current_window[0] > 0 else 0,
                current_window[-1],
                features.get("month", 6),
                features.get("seasonal_mult", 1.0),
                features.get("risk_norm", 0.0),
                features.get("eu_distance", 0.0),
            ]], dtype=np.float32)
            pred = float(model.predict(row)[0])
            current_window = current_window[1:] + [pred]

        return pred

    except Exception as e:
        print(f"  LightGBM error: {e}")
        return None


def _confidence(n_records: int, risk_score: float, volatility: float) -> float:
    """
    Confidence score 0–100.
    More data → higher confidence.
    High volatility → lower confidence.
    High risk → slightly lower confidence (uncertainty increases).
    """
    data_score = min(50, n_records * 0.8)   # max 50 pts from data quantity
    vol_penalty = min(20, volatility * 100)  # penalty for volatility
    risk_penalty = risk_score * 0.15         # max 15 pts penalty

    conf = data_score - vol_penalty - risk_penalty
    return max(10, min(95, conf + 40))       # shift up so base is reasonable


def _identify_drivers(features: dict, risk_events: list, product_id: str) -> list:
    """Identify the top 3 drivers of the forecast."""
    drivers = []

    if risk_events:
        drivers.append(f"weather_risk({'_'.join(risk_events[:2])})")
    if abs(features.get("mom_30", 0)) > 0.05:
        direction = "upward" if features["mom_30"] > 0 else "downward"
        drivers.append(f"price_momentum_{direction}_30d")
    if abs(features.get("eu_distance", 0)) > 0.1:
        direction = "above" if features["eu_distance"] > 0 else "below"
        drivers.append(f"price_{direction}_EU_benchmark")
    if features.get("seasonal_mult", 1) > 1.03:
        drivers.append("seasonal_peak_demand")
    elif features.get("seasonal_mult", 1) < 0.97:
        drivers.append("seasonal_low_demand")

    return drivers[:4] if drivers else ["stable_market_conditions"]


def generate_forecast(product_id: str, risk_score: float = 10.0,
                      risk_events: list = None, save_to_db: bool = True) -> dict:
    """
    Main forecast function.
    Returns base_forecast, adjusted_forecast, confidence, low/high range, trend, drivers.
    """
    if risk_events is None:
        risk_events = []

    prices = _get_prices(product_id, days=90)
    month  = datetime.utcnow().month
    eu     = EU_BENCHMARKS.get(product_id, {})

    # ── FALLBACK: No data in DB ───────────────────────────────────────────────
    if not prices:
        eu_avg = eu.get("avg", 5.0)
        seasonal_group = "nuts" if product_id in NUT_PRODUCTS else "dried"
        seasonal_mult = SEASONAL_MULTIPLIERS[seasonal_group][month - 1]
        base = eu_avg * seasonal_mult
        risk_adj = 1 + (risk_score / 100) * 0.12

        result = {
            "product_id":        product_id,
            "base_forecast":     round(base, 3),
            "adjusted_forecast": round(base * risk_adj, 3),
            "forecast_low":      round(base * 0.92, 3),
            "forecast_high":     round(base * (1 + risk_score / 200), 3),
            "confidence_score":  25.0,
            "trend":             "UP" if risk_score > 40 else "STABLE",
            "main_drivers":      risk_events[:2] if risk_events else ["insufficient_data"],
            "method":            "eu_benchmark_fallback",
        }
        return result

    features = _build_features(prices, risk_score, month, product_id)

    # ── BASE FORECAST (linear) ────────────────────────────────────────────────
    base_forecast = _linear_forecast(features, horizon_days=30)

    # ── ADJUSTED FORECAST (LightGBM if available, else enhanced linear) ──────
    lgbm_pred = _lgbm_forecast(prices, features, horizon_days=30)

    if lgbm_pred:
        # Blend: 60% LightGBM + 40% linear
        adjusted_forecast = lgbm_pred * 0.6 + base_forecast * 0.4
        method = "lightgbm_blend"
    else:
        # Enhanced linear: add risk premium
        risk_premium = 1 + (risk_score / 100) * 0.15
        adjusted_forecast = base_forecast * risk_premium
        method = "enhanced_linear"

    # ── RANGE: low / high ────────────────────────────────────────────────────
    vol = features.get("volatility", 0.05)
    band = max(0.05, vol * 1.5)
    forecast_low  = adjusted_forecast * (1 - band)
    forecast_high = adjusted_forecast * (1 + band + risk_score / 500)

    # ── CONFIDENCE ────────────────────────────────────────────────────────────
    confidence = _confidence(features["n_records"], risk_score, vol)

    # ── TREND ─────────────────────────────────────────────────────────────────
    last = features["last_price"]
    change_pct = (adjusted_forecast - last) / last if last > 0 else 0
    if change_pct > 0.03:
        trend = "UP"
    elif change_pct < -0.03:
        trend = "DOWN"
    else:
        trend = "STABLE"

    # ── DRIVERS ───────────────────────────────────────────────────────────────
    drivers = _identify_drivers(features, risk_events, product_id)

    result = {
        "product_id":        product_id,
        "base_forecast":     round(base_forecast, 3),
        "adjusted_forecast": round(adjusted_forecast, 3),
        "forecast_low":      round(forecast_low, 3),
        "forecast_high":     round(forecast_high, 3),
        "confidence_score":  round(confidence, 1),
        "trend":             trend,
        "change_pct":        round(change_pct * 100, 2),
        "main_drivers":      drivers,
        "method":            method,
        "n_data_points":     features["n_records"],
    }

    # ── SAVE TO DB ─────────────────────────────────────────────────────────────
    if save_to_db:
        db = SessionLocal()
        try:
            db.add(ForecastFeature(
                product_id=product_id,
                features_json={k: float(v) if isinstance(v, (int, float, np.floating)) else v
                               for k, v in features.items()},
                base_forecast=base_forecast,
                adjusted_forecast=adjusted_forecast,
                forecast_low=forecast_low,
                forecast_high=forecast_high,
                confidence_score=confidence,
                trend=trend,
                main_drivers=drivers,
            ))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"  Forecast DB save error ({product_id}): {e}")
        finally:
            db.close()

    return result
