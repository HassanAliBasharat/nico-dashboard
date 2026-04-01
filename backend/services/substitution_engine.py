# backend/services/substitution_engine.py
# ═══════════════════════════════════════════════════════════════════════════════
# NICO Substitution Intelligence + Profit Opportunity Engine
#
# Module 1: Substitution Intelligence
#   Given a product under stress, return ranked alternatives by:
#   availability_score × (1 - price_premium) × quality_match_score
#
# Module 2: Opportunity Engine
#   Given risk + forecast → compute opportunity_score and recommended_action
#   Actions: BUY_EARLY | WAIT | SWITCH_ORIGIN | HOLD_STOCK
# ═══════════════════════════════════════════════════════════════════════════════

import os, sys
from datetime import datetime
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.database.db import SessionLocal
from backend.database.models_intelligence import ProductSubstitute, OpportunityFlag

# ─── Static substitution map ─────────────────────────────────────────────────
# Format: product_id → list of alternatives
# Each entry has: substitute_label, origin, price_diff_pct (positive = more expensive),
#                 availability_score (0–100), quality_match (EXACT|CLOSE|ACCEPTABLE), reason
SUBSTITUTION_MAP = {
    "dried_apricot": [
        {
            "substitute_product": "dried_apricot_uzbek",
            "substitute_label":   "Dried Apricots — Uzbekistan",
            "origin":             "Uzbekistan",
            "price_diff_pct":     -8.0,
            "availability_score": 82,
            "quality_match":      "EXACT",
            "reason":             "Uzbekistan is Turkey's primary alternative — similar quality, lower price, not affected by Turkish frost events",
        },
        {
            "substitute_product": "dried_apricot_iran",
            "substitute_label":   "Dried Apricots — Iran",
            "origin":             "Iran",
            "price_diff_pct":     -15.0,
            "availability_score": 65,
            "quality_match":      "CLOSE",
            "reason":             "Iran produces good quality apricots. Availability subject to export/sanctions conditions.",
        },
        {
            "substitute_product": "dried_peach",
            "substitute_label":   "Dried Peaches (close substitute)",
            "origin":             "South Africa",
            "price_diff_pct":     5.0,
            "availability_score": 75,
            "quality_match":      "ACCEPTABLE",
            "reason":             "Dried peaches can substitute in bakery/confectionery applications where apricots are used for flavor and texture.",
        },
    ],
    "hazelnut": [
        {
            "substitute_product": "hazelnut_georgia",
            "substitute_label":   "Hazelnuts — Georgia",
            "origin":             "Georgia",
            "price_diff_pct":     -12.0,
            "availability_score": 72,
            "quality_match":      "CLOSE",
            "reason":             "Georgia is Turkey's main hazelnut competitor. Quality slightly lower but good for industrial use.",
        },
        {
            "substitute_product": "almond",
            "substitute_label":   "Almonds — USA",
            "origin":             "USA",
            "price_diff_pct":     -25.0,
            "availability_score": 90,
            "quality_match":      "ACCEPTABLE",
            "reason":             "For confectionery/bakery where texture matters more than specific nut flavor.",
        },
    ],
    "pistachio": [
        {
            "substitute_product": "pistachio_usa",
            "substitute_label":   "Pistachios — USA (California)",
            "origin":             "USA",
            "price_diff_pct":     8.0,
            "availability_score": 88,
            "quality_match":      "EXACT",
            "reason":             "USA pistachios are a direct quality substitute for Iranian pistachios. Higher price but fully available.",
        },
        {
            "substitute_product": "pistachio_turkey",
            "substitute_label":   "Pistachios — Turkey",
            "origin":             "Turkey",
            "price_diff_pct":     3.0,
            "availability_score": 78,
            "quality_match":      "EXACT",
            "reason":             "Turkish pistachios (Antep variety) are premium quality, good EU market acceptance.",
        },
    ],
    "walnut": [
        {
            "substitute_product": "walnut_chile",
            "substitute_label":   "Walnuts — Chile",
            "origin":             "Chile",
            "price_diff_pct":     -5.0,
            "availability_score": 85,
            "quality_match":      "EXACT",
            "reason":             "Chilean walnuts are harvested spring (Southern Hemisphere) — counter-seasonal to US/China supply.",
        },
        {
            "substitute_product": "walnut_china",
            "substitute_label":   "Walnuts — China",
            "origin":             "China",
            "price_diff_pct":     -20.0,
            "availability_score": 80,
            "quality_match":      "CLOSE",
            "reason":             "Chinese walnuts are cost-effective for industrial use. Check EU food safety compliance.",
        },
    ],
    "almond": [
        {
            "substitute_product": "almond_spain",
            "substitute_label":   "Almonds — Spain",
            "origin":             "Spain",
            "price_diff_pct":     -10.0,
            "availability_score": 75,
            "quality_match":      "EXACT",
            "reason":             "Spanish almonds (Marcona, Largueta) are premium EU-origin alternative to USA. Higher domestic preference.",
        },
        {
            "substitute_product": "almond_australia",
            "substitute_label":   "Almonds — Australia",
            "origin":             "Australia",
            "price_diff_pct":     -3.0,
            "availability_score": 78,
            "quality_match":      "EXACT",
            "reason":             "Australian almonds harvest counter-seasonal to USA (Feb–Apr). Good supply when US crop is stressed.",
        },
    ],
    "raisin": [
        {
            "substitute_product": "raisin_turkey",
            "substitute_label":   "Sultana Raisins — Turkey",
            "origin":             "Turkey",
            "price_diff_pct":     -18.0,
            "availability_score": 85,
            "quality_match":      "CLOSE",
            "reason":             "Turkish sultana raisins are the most common EU alternative. Different size/sweetness profile.",
        },
    ],
    "cashew": [
        {
            "substitute_product": "cashew_ivory_coast",
            "substitute_label":   "Cashews — Ivory Coast",
            "origin":             "Ivory Coast",
            "price_diff_pct":     -8.0,
            "availability_score": 72,
            "quality_match":      "CLOSE",
            "reason":             "West African cashews (Ivory Coast/Benin) are W240/W320 alternative to Asian origin. Fresher crop Nov–Apr.",
        },
    ],
    "date": [
        {
            "substitute_product": "date_deglet",
            "substitute_label":   "Deglet Noor Dates — Tunisia",
            "origin":             "Tunisia",
            "price_diff_pct":     -45.0,
            "availability_score": 90,
            "quality_match":      "CLOSE",
            "reason":             "Deglet Noor (Tunisia) is an affordable alternative to Medjool. Good EU market acceptance for processed use.",
        },
    ],
    "dried_fig": [
        {
            "substitute_product": "dried_fig_iran",
            "substitute_label":   "Dried Figs — Iran",
            "origin":             "Iran",
            "price_diff_pct":     -15.0,
            "availability_score": 65,
            "quality_match":      "CLOSE",
            "reason":             "Iranian dried figs are good alternative to Turkish. Subject to availability.",
        },
    ],
    "pine_nut": [
        {
            "substitute_product": "pine_nut_russia",
            "substitute_label":   "Siberian Pine Nuts — Russia",
            "origin":             "Russia",
            "price_diff_pct":     -10.0,
            "availability_score": 60,
            "quality_match":      "EXACT",
            "reason":             "Siberian (Koraiensis) pine nuts are considered premium over Chinese. Check import compliance.",
        },
        {
            "substitute_product": "sunflower_seed",
            "substitute_label":   "Sunflower Seeds (budget substitute)",
            "origin":             "Ukraine / Russia",
            "price_diff_pct":     -85.0,
            "availability_score": 95,
            "quality_match":      "ACCEPTABLE",
            "reason":             "For bulk food manufacturing applications only — very different product but fills similar nutritional role.",
        },
    ],
}

# Default fallback for products without a specific map
DEFAULT_SUBSTITUTES = [
    {
        "substitute_product": "generic_alternative",
        "substitute_label":   "Contact supplier for alternatives",
        "origin":             "Various",
        "price_diff_pct":     0.0,
        "availability_score": 50,
        "quality_match":      "CLOSE",
        "reason":             "No pre-mapped substitutes for this product. Contact your supplier for availability.",
    }
]


def get_substitutes(product_id: str, risk_score: float = 0) -> list:
    """
    Return ranked substitutes for a product.
    When risk is high, prioritises availability over price.
    """
    subs = SUBSTITUTION_MAP.get(product_id, DEFAULT_SUBSTITUTES)

    # Score each substitute
    def _score(s):
        avail  = s.get("availability_score", 50) / 100
        price  = 1 - max(-1, min(1, s.get("price_diff_pct", 0) / 50))  # cheaper = higher score
        quality_scores = {"EXACT": 1.0, "CLOSE": 0.75, "ACCEPTABLE": 0.5}
        quality = quality_scores.get(s.get("quality_match", "CLOSE"), 0.6)

        # When risk is high, weight availability more
        risk_weight = risk_score / 100
        score = (
            avail   * (0.4 + risk_weight * 0.3) +
            price   * (0.3 - risk_weight * 0.1) +
            quality * 0.3
        )
        return score

    ranked = sorted(subs, key=_score, reverse=True)
    return ranked


# ─── OPPORTUNITY ENGINE ───────────────────────────────────────────────────────

ACTION_LABELS = {
    "BUY_EARLY":    "🟢 Buy Early — Price expected to rise. Lock in supply now.",
    "WAIT":         "🔵 Wait — Price may fall. Hold purchasing decision.",
    "SWITCH_ORIGIN":"🟡 Switch Origin — Current source under stress. Alternative recommended.",
    "HOLD_STOCK":   "🟠 Hold Current Stock — Supply disruption likely. Protect existing inventory.",
}

URGENCY_MAP = {
    "BUY_EARLY":     lambda score: "NOW" if score > 75 else "THIS_WEEK",
    "SWITCH_ORIGIN": lambda score: "NOW" if score > 70 else "THIS_WEEK",
    "HOLD_STOCK":    lambda score: "NOW" if score > 80 else "THIS_WEEK",
    "WAIT":          lambda score: "THIS_MONTH",
}


def calculate_opportunity(
    product_id:     str,
    risk_score:     float,
    forecast_change_pct: float,
    availability:   str,
    triggered_events: list,
    save_to_db:     bool = True,
) -> dict:
    """
    Decision engine for purchasing recommendations.

    Logic matrix:
    ┌──────────────┬────────────────┬───────────────────────┐
    │ risk_score   │ forecast_chg   │ action                │
    ├──────────────┼────────────────┼───────────────────────┤
    │ HIGH (≥60)   │ UP (>3%)       │ BUY_EARLY             │
    │ HIGH (≥60)   │ UP + avail LOW │ HOLD_STOCK + SWITCH   │
    │ HIGH (≥60)   │ STABLE/DOWN    │ SWITCH_ORIGIN         │
    │ MEDIUM (30–60)│ UP (>5%)      │ BUY_EARLY             │
    │ MEDIUM       │ STABLE         │ WAIT                  │
    │ LOW (<30)    │ UP (>8%)       │ BUY_EARLY             │
    │ LOW (<30)    │ ANY            │ WAIT                  │
    └──────────────┴────────────────┴───────────────────────┘
    """
    # Opportunity score = weighted combination of risk + forecast + availability
    avail_penalty = {"LOW": 30, "NORMAL": 0, "HIGH": -10}.get(availability, 0)
    opp_score = (
        risk_score * 0.4 +
        max(0, forecast_change_pct) * 2 +
        avail_penalty
    )
    opp_score = max(0, min(100, opp_score))

    # Determine action
    if risk_score >= 60 and forecast_change_pct > 3:
        action = "BUY_EARLY"
        if availability == "LOW":
            action = "HOLD_STOCK"
    elif risk_score >= 60:
        action = "SWITCH_ORIGIN"
    elif 30 <= risk_score < 60 and forecast_change_pct > 5:
        action = "BUY_EARLY"
    elif forecast_change_pct < -3 and risk_score < 40:
        action = "WAIT"
    elif risk_score < 30 and forecast_change_pct > 8:
        action = "BUY_EARLY"
    else:
        action = "WAIT"

    action_label = ACTION_LABELS.get(action, action)
    urgency = URGENCY_MAP.get(action, lambda s: "THIS_MONTH")(opp_score)

    # Build explanation
    parts = []
    if risk_score >= 60:
        parts.append(f"High supply risk ({risk_score:.0f}/100)")
    if triggered_events:
        parts.append(f"Weather events: {', '.join(triggered_events[:3])}")
    if abs(forecast_change_pct) > 2:
        direction = "rise" if forecast_change_pct > 0 else "fall"
        parts.append(f"Price expected to {direction} {abs(forecast_change_pct):.1f}% in 30 days")
    if availability == "LOW":
        parts.append("Availability forecast: LOW")

    explanation = " | ".join(parts) if parts else "Normal market conditions."

    result = {
        "product_id":          product_id,
        "opportunity_score":   round(opp_score, 1),
        "recommended_action":  action,
        "action_label":        action_label,
        "forecast_change_pct": round(forecast_change_pct, 2),
        "risk_score":          round(risk_score, 1),
        "availability":        availability,
        "urgency":             urgency,
        "explanation":         explanation,
    }

    if save_to_db:
        db = SessionLocal()
        try:
            db.add(OpportunityFlag(
                product_id=product_id,
                opportunity_score=opp_score,
                recommended_action=action,
                action_label=action_label,
                forecast_change_pct=forecast_change_pct,
                risk_score=risk_score,
                urgency=urgency,
                explanation=explanation,
            ))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"  Opportunity DB save error ({product_id}): {e}")
        finally:
            db.close()

    return result
