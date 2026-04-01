# backend/services/risk_engine.py
# ═══════════════════════════════════════════════════════════════════════════════
# NICO Supply Risk Engine
# Converts weather data + crop calendar into actionable risk scores
#
# FORMULA:
#   risk_score = base_score
#              + frost_penalty     (if frost during bloom)
#              + heat_penalty      (if heat stress during critical window)
#              + rain_penalty      (if rain anomaly during harvest)
#              + drought_penalty   (if prolonged dry during fruit set)
#              + export_ban_bonus  (manual override flag)
#
# Output: 0–100 (0 = no risk, 100 = severe supply disruption expected)
# ═══════════════════════════════════════════════════════════════════════════════

import requests
from datetime import datetime, date, timedelta
from typing import Optional
import os, sys

try:
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from backend.database.db import SessionLocal
    from backend.database.models_intelligence import RiskSignal, WeatherEvent
except Exception:
    pass

# ─── Crop calendar: bloom and harvest month ranges ──────────────────────────
# Format: (start_month, end_month) inclusive, 1=Jan, 12=Dec
CROP_CALENDAR = {
    "almond":          {"bloom": (2, 3),  "harvest": (8, 9),   "frost_threshold": 0,  "heat_threshold": 38},
    "walnut":          {"bloom": (3, 4),  "harvest": (9, 10),  "frost_threshold": 0,  "heat_threshold": 40},
    "pistachio":       {"bloom": (3, 4),  "harvest": (8, 9),   "frost_threshold": -2, "heat_threshold": 42},
    "cashew":          {"bloom": (11, 1), "harvest": (2, 5),   "frost_threshold": 10, "heat_threshold": 45},
    "hazelnut":        {"bloom": (1, 2),  "harvest": (8, 9),   "frost_threshold": -3, "heat_threshold": 36},
    "pecan":           {"bloom": (4, 5),  "harvest": (10, 11), "frost_threshold": 0,  "heat_threshold": 40},
    "brazil_nut":      {"bloom": (10, 11),"harvest": (1, 3),   "frost_threshold": 12, "heat_threshold": 40},
    "macadamia":       {"bloom": (7, 9),  "harvest": (3, 7),   "frost_threshold": 5,  "heat_threshold": 38},
    "raisin":          {"bloom": (3, 4),  "harvest": (8, 9),   "frost_threshold": -1, "heat_threshold": 40},
    "pine_nut":        {"bloom": (4, 5),  "harvest": (9, 10),  "frost_threshold": -5, "heat_threshold": 38},
    "dried_mango":     {"bloom": (12, 2), "harvest": (3, 6),   "frost_threshold": 8,  "heat_threshold": 45},
    "dried_cranberry": {"bloom": (5, 6),  "harvest": (9, 10),  "frost_threshold": -2, "heat_threshold": 35},
    "dried_blueberry": {"bloom": (4, 5),  "harvest": (6, 8),   "frost_threshold": -2, "heat_threshold": 35},
    "banana_chip":     {"bloom": (1, 12), "harvest": (1, 12),  "frost_threshold": 10, "heat_threshold": 45},
    "dried_apple":     {"bloom": (3, 4),  "harvest": (8, 10),  "frost_threshold": -1, "heat_threshold": 38},
    "dried_papaya":    {"bloom": (1, 12), "harvest": (1, 12),  "frost_threshold": 8,  "heat_threshold": 45},
    "date":            {"bloom": (2, 3),  "harvest": (9, 11),  "frost_threshold": -2, "heat_threshold": 50},
    "dried_apricot":   {"bloom": (3, 4),  "harvest": (6, 7),   "frost_threshold": 0,  "heat_threshold": 38},
    "dried_fig":       {"bloom": (5, 6),  "harvest": (8, 10),  "frost_threshold": -2, "heat_threshold": 42},
    "prune":           {"bloom": (2, 3),  "harvest": (7, 8),   "frost_threshold": 0,  "heat_threshold": 38},
}

# ─── Origin countries per product ───────────────────────────────────────────
PRODUCT_ORIGINS = {
    "almond":          [{"region": "USA (California)", "lat": 36.78, "lon": -119.42, "weight": 0.6},
                        {"region": "Spain",             "lat": 40.41, "lon": -3.70,   "weight": 0.3}],
    "walnut":          [{"region": "USA (California)", "lat": 36.78, "lon": -119.42, "weight": 0.5},
                        {"region": "Chile",             "lat": -30.0, "lon": -71.20,  "weight": 0.3}],
    "pistachio":       [{"region": "Iran",             "lat": 32.43, "lon": 53.69,   "weight": 0.5},
                        {"region": "USA (California)", "lat": 36.78, "lon": -119.42, "weight": 0.4}],
    "cashew":          [{"region": "Vietnam",          "lat": 14.06, "lon": 108.28,  "weight": 0.5},
                        {"region": "India",             "lat": 20.59, "lon": 78.96,   "weight": 0.3}],
    "hazelnut":        [{"region": "Turkey",           "lat": 41.00, "lon": 36.00,   "weight": 0.75}],
    "pecan":           [{"region": "USA",              "lat": 31.00, "lon": -98.00,  "weight": 0.8}],
    "brazil_nut":      [{"region": "Bolivia",          "lat": -16.29,"lon": -63.59,  "weight": 0.6}],
    "macadamia":       [{"region": "Kenya",            "lat": -1.29, "lon": 36.82,   "weight": 0.5},
                        {"region": "South Africa",     "lat": -28.48,"lon": 24.67,   "weight": 0.3}],
    "raisin":          [{"region": "Turkey",           "lat": 38.41, "lon": 27.13,   "weight": 0.45},
                        {"region": "USA (California)", "lat": 36.78, "lon": -119.42, "weight": 0.35}],
    "pine_nut":        [{"region": "China",            "lat": 34.00, "lon": 108.00,  "weight": 0.7}],
    "dried_mango":     [{"region": "Thailand",         "lat": 13.75, "lon": 100.52,  "weight": 0.6}],
    "dried_cranberry": [{"region": "USA",              "lat": 44.50, "lon": -89.50,  "weight": 0.8}],
    "dried_blueberry": [{"region": "USA",              "lat": 44.50, "lon": -89.50,  "weight": 0.7}],
    "banana_chip":     [{"region": "Philippines",      "lat": 12.88, "lon": 121.77,  "weight": 0.7}],
    "dried_apple":     [{"region": "China",            "lat": 34.00, "lon": 108.00,  "weight": 0.6}],
    "dried_papaya":    [{"region": "Thailand",         "lat": 13.75, "lon": 100.52,  "weight": 0.7}],
    "date":            [{"region": "Saudi Arabia",     "lat": 24.69, "lon": 46.72,   "weight": 0.5},
                        {"region": "Tunisia",          "lat": 33.88, "lon": 9.53,    "weight": 0.3}],
    "dried_apricot":   [{"region": "Turkey",           "lat": 38.37, "lon": 38.31,   "weight": 0.65},
                        {"region": "Uzbekistan",       "lat": 41.30, "lon": 63.97,   "weight": 0.25}],
    "dried_fig":       [{"region": "Turkey",           "lat": 37.85, "lon": 27.84,   "weight": 0.70}],
    "prune":           [{"region": "USA (California)", "lat": 39.50, "lon": -121.50, "weight": 0.5},
                        {"region": "France",           "lat": 44.50, "lon": 0.50,    "weight": 0.3}],
}

# ─── Risk score weights ──────────────────────────────────────────────────────
WEIGHTS = {
    "frost_bloom":       40,   # frost during bloom — most damaging
    "frost_harvest":     20,   # frost at harvest
    "heat_bloom":        25,   # heat stress during bloom
    "heat_harvest":      15,   # heat stress at harvest
    "rain_harvest":      20,   # rain during harvest (mold, quality issues)
    "drought_fruit_set": 20,   # drought during fruit development
}


def _month_in_range(month: int, start: int, end: int) -> bool:
    """Check if month is within a range, handles wrap-around (e.g. Nov–Jan)."""
    if start <= end:
        return start <= month <= end
    else:  # wraps around year end
        return month >= start or month <= end


def _get_weather(lat: float, lon: float, past_days: int = 30) -> dict:
    """Fetch recent daily temperature from Open-Meteo (free, no key)."""
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
            f"&timezone=auto&past_days={past_days}&forecast_days=7"
        )
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            d = r.json().get("daily", {})
            return {
                "dates":   d.get("time", []),
                "t_max":   d.get("temperature_2m_max", []),
                "t_min":   d.get("temperature_2m_min", []),
                "precip":  d.get("precipitation_sum", []),
            }
    except Exception:
        pass
    return {}


def _severity(delta: float) -> str:
    """Convert temperature delta from threshold to severity label."""
    delta = abs(delta)
    if delta < 3:   return "LOW"
    if delta < 8:   return "MEDIUM"
    if delta < 15:  return "HIGH"
    return "CRITICAL"


def calculate_risk(product_id: str, save_to_db: bool = True) -> dict:
    """
    Main risk calculation function.
    Returns a dict with risk_score, availability, triggered_events, explanation.
    """
    cal = CROP_CALENDAR.get(product_id)
    origins = PRODUCT_ORIGINS.get(product_id, [])

    if not cal or not origins:
        return {
            "product_id":       product_id,
            "risk_score":       10.0,
            "availability":     "NORMAL",
            "triggered_events": [],
            "explanation":      "No crop calendar or origin data available.",
        }

    current_month = datetime.utcnow().month
    triggered_events = []
    score_additions = []
    explanations = []

    bloom_start,   bloom_end   = cal["bloom"]
    harvest_start, harvest_end = cal["harvest"]
    frost_thresh  = cal["frost_threshold"]
    heat_thresh   = cal["heat_threshold"]

    in_bloom   = _month_in_range(current_month, bloom_start, bloom_end)
    in_harvest = _month_in_range(current_month, harvest_start, harvest_end)
    crop_stage = "bloom" if in_bloom else ("harvest" if in_harvest else "off_season")

    db = SessionLocal() if save_to_db else None

    for origin in origins:
        weight  = origin["weight"]
        region  = origin["region"]
        weather = _get_weather(origin["lat"], origin["lon"], past_days=14)

        if not weather.get("dates"):
            continue

        t_maxes = [t for t in weather["t_max"] if t is not None]
        t_mins  = [t for t in weather["t_min"] if t is not None]
        precips = [p for p in weather["precip"] if p is not None]

        if not t_mins or not t_maxes:
            continue

        avg_min  = sum(t_mins)  / len(t_mins)
        avg_max  = sum(t_maxes) / len(t_maxes)
        avg_prec = sum(precips) / len(precips) if precips else 0
        min_temp = min(t_mins)
        max_temp = max(t_maxes)

        # ── FROST CHECK ──────────────────────────────────────────────────────
        if min_temp < frost_thresh:
            delta = frost_thresh - min_temp
            severity = _severity(delta)
            if in_bloom:
                penalty = WEIGHTS["frost_bloom"] * weight
                triggered_events.append("frost_bloom")
                score_additions.append(penalty)
                explanations.append(
                    f"Frost detected in {region} during bloom "
                    f"({min_temp:.1f}°C vs threshold {frost_thresh}°C) — "
                    f"HIGH risk of yield loss ({severity})"
                )
            elif in_harvest:
                penalty = WEIGHTS["frost_harvest"] * weight
                triggered_events.append("frost_harvest")
                score_additions.append(penalty)
                explanations.append(
                    f"Frost during harvest in {region} ({min_temp:.1f}°C) — "
                    f"quality damage risk ({severity})"
                )
            if db:
                db.add(WeatherEvent(
                    product_id=product_id, region=region,
                    event_type="frost", severity=severity,
                    temperature=min_temp, threshold=frost_thresh,
                    crop_stage=crop_stage, date=datetime.utcnow()
                ))

        # ── HEAT STRESS ──────────────────────────────────────────────────────
        if max_temp > heat_thresh:
            delta = max_temp - heat_thresh
            severity = _severity(delta)
            if in_bloom:
                penalty = WEIGHTS["heat_bloom"] * weight
                triggered_events.append("heat_bloom")
                score_additions.append(penalty)
                explanations.append(
                    f"Heat stress in {region} during bloom "
                    f"({max_temp:.1f}°C vs threshold {heat_thresh}°C) — "
                    f"pollination damage risk ({severity})"
                )
            elif in_harvest:
                penalty = WEIGHTS["heat_harvest"] * weight
                triggered_events.append("heat_harvest")
                score_additions.append(penalty)
                explanations.append(f"Heat stress during harvest in {region} ({severity})")
            if db:
                db.add(WeatherEvent(
                    product_id=product_id, region=region,
                    event_type="heat_stress", severity=severity,
                    temperature=max_temp, threshold=heat_thresh,
                    crop_stage=crop_stage, date=datetime.utcnow()
                ))

        # ── RAIN ANOMALY DURING HARVEST ──────────────────────────────────────
        if in_harvest and avg_prec > 8.0:
            penalty = WEIGHTS["rain_harvest"] * weight
            triggered_events.append("rain_harvest")
            score_additions.append(penalty)
            explanations.append(
                f"Above-normal rainfall in {region} during harvest "
                f"({avg_prec:.1f}mm/day avg) — mold/quality risk"
            )
            if db:
                db.add(WeatherEvent(
                    product_id=product_id, region=region,
                    event_type="rain_anomaly", severity="MEDIUM",
                    temperature=avg_max, threshold=8.0,
                    crop_stage="harvest", date=datetime.utcnow()
                ))

        # ── DROUGHT CHECK ─────────────────────────────────────────────────────
        if avg_prec < 0.3 and avg_max > 30:
            penalty = WEIGHTS["drought_fruit_set"] * weight * 0.5
            triggered_events.append("drought")
            score_additions.append(penalty)
            explanations.append(
                f"Drought conditions in {region} (precip {avg_prec:.2f}mm, "
                f"temp {avg_max:.1f}°C) — fruit size/yield risk"
            )
            if db:
                db.add(WeatherEvent(
                    product_id=product_id, region=region,
                    event_type="drought", severity="MEDIUM",
                    temperature=avg_max, threshold=0.3,
                    crop_stage=crop_stage, date=datetime.utcnow()
                ))

    # ── COMPUTE FINAL SCORE ────────────────────────────────────────────────────
    base_score = 5.0  # small baseline for market uncertainty
    total = base_score + sum(score_additions)
    risk_score = min(100.0, total)

    # Off-season: reduce risk (weather matters less outside critical windows)
    if crop_stage == "off_season":
        risk_score = risk_score * 0.5

    triggered_events = list(set(triggered_events))  # deduplicate

    # ── AVAILABILITY FORECAST ─────────────────────────────────────────────────
    if risk_score >= 65:
        availability = "LOW"
    elif risk_score >= 35:
        availability = "NORMAL"
    else:
        availability = "HIGH"

    explanation = (
        " | ".join(explanations)
        if explanations
        else f"No significant weather anomalies detected for {product_id}. Conditions normal."
    )

    result = {
        "product_id":       product_id,
        "risk_score":       round(risk_score, 1),
        "availability":     availability,
        "triggered_events": triggered_events,
        "explanation":      explanation,
        "crop_stage":       crop_stage,
    }

    # ── SAVE TO DB ────────────────────────────────────────────────────────────
    if db and save_to_db:
        try:
            db.add(RiskSignal(
                product_id=product_id,
                risk_score=risk_score,
                availability=availability,
                triggered_events=triggered_events,
                explanation=explanation,
            ))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"  Risk DB save error ({product_id}): {e}")
        finally:
            db.close()

    return result


def get_latest_risk(product_id: str) -> Optional[dict]:
    """Return most recent risk signal from DB (avoid re-calculating if fresh)."""
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(hours=6)
        signal = (
            db.query(RiskSignal)
            .filter(RiskSignal.product_id == product_id)
            .filter(RiskSignal.timestamp >= cutoff)
            .order_by(RiskSignal.timestamp.desc())
            .first()
        )
        return signal.to_dict() if signal else None
    finally:
        db.close()
