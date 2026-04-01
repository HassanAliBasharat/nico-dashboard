# backend/services/llm_layer.py
# ═══════════════════════════════════════════════════════════════════════════════
# NICO LLM Layer — Used MINIMALLY for:
#   1. Summarising complex risk situations into plain English
#   2. Explaining forecasts to non-technical users
#   3. Generating purchasing recommendations narrative
#
# Uses Anthropic Claude API (same key as document upload feature).
# Falls back to template-based text if API unavailable.
# ═══════════════════════════════════════════════════════════════════════════════

import os
import requests
from typing import Optional

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

PRODUCT_NAMES = {
    "almond": "Almonds", "cashew": "Cashews", "pistachio": "Pistachios",
    "walnut": "Walnuts", "raisin": "Raisins", "date": "Dates",
    "dried_fig": "Dried Figs", "dried_apricot": "Dried Apricots",
    "hazelnut": "Hazelnuts", "pecan": "Pecans", "brazil_nut": "Brazil Nuts",
    "macadamia": "Macadamia", "pine_nut": "Pine Nuts",
    "dried_mango": "Dried Mango", "dried_cranberry": "Dried Cranberries",
    "dried_blueberry": "Dried Blueberries", "banana_chip": "Dried Banana Chips",
    "dried_apple": "Dried Apple", "dried_papaya": "Dried Papaya", "prune": "Prunes",
}


def _call_claude(prompt: str, max_tokens: int = 200) -> Optional[str]:
    """Call Claude API for a short explanation. Returns None on failure."""
    if not ANTHROPIC_API_KEY:
        return None
    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": max_tokens,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=10,
        )
        if r.status_code == 200:
            return r.json()["content"][0]["text"].strip()
    except Exception:
        pass
    return None


def _template_risk_summary(product_id: str, risk_score: float,
                            events: list, availability: str, crop_stage: str) -> str:
    """Template fallback when LLM is unavailable."""
    name = PRODUCT_NAMES.get(product_id, product_id.replace("_", " ").title())
    event_text = ", ".join(e.replace("_", " ") for e in events) if events else "no weather anomalies"
    avail_text = {"LOW": "tight", "NORMAL": "normal", "HIGH": "ample"}.get(availability, "normal")
    risk_text  = "high" if risk_score >= 65 else ("moderate" if risk_score >= 35 else "low")

    if not events:
        return (
            f"{name}: Market conditions are stable. Risk score {risk_score:.0f}/100. "
            f"Supply availability is {avail_text}."
        )
    return (
        f"{name}: {risk_text.capitalize()} supply risk ({risk_score:.0f}/100) detected. "
        f"Weather signals: {event_text} during {crop_stage} stage. "
        f"Expected availability: {avail_text}. "
        f"{'Price pressure expected.' if risk_score > 40 else 'Monitor closely.'}"
    )


def _template_forecast_summary(product_id: str, base: float, adjusted: float,
                                change_pct: float, trend: str, drivers: list) -> str:
    name = PRODUCT_NAMES.get(product_id, product_id.replace("_", " ").title())
    direction = "rise" if change_pct > 0 else "fall"
    driver_text = ", ".join(d.replace("_", " ") for d in drivers[:2]) if drivers else "market dynamics"
    return (
        f"{name}: 30-day price forecast ${adjusted:.2f}/kg "
        f"({'+' if change_pct >= 0 else ''}{change_pct:.1f}%). "
        f"Driven by {driver_text}. "
        f"Trend: {trend}."
    )


def explain_risk(product_id: str, risk_score: float, events: list,
                 availability: str, crop_stage: str = "unknown") -> str:
    """Generate a plain-English risk explanation."""
    name = PRODUCT_NAMES.get(product_id, product_id.replace("_", " ").title())
    event_text = ", ".join(e.replace("_", " ") for e in events) if events else "no anomalies detected"

    prompt = (
        f"Write a single clear sentence (max 40 words) for a commodity buyer explaining: "
        f"Product={name}, Risk score={risk_score:.0f}/100, "
        f"Supply availability={availability}, Crop stage={crop_stage}, "
        f"Weather events={event_text}. "
        f"Be direct and practical. No markdown."
    )

    llm_result = _call_claude(prompt, max_tokens=80)
    if llm_result:
        return llm_result

    return _template_risk_summary(product_id, risk_score, events, availability, crop_stage)


def explain_forecast(product_id: str, base: float, adjusted: float,
                     change_pct: float, trend: str, drivers: list) -> str:
    """Generate a plain-English forecast explanation."""
    name = PRODUCT_NAMES.get(product_id, product_id.replace("_", " ").title())
    driver_text = ", ".join(d.replace("_", " ") for d in drivers[:3]) if drivers else "market dynamics"

    prompt = (
        f"Write a single clear sentence (max 40 words) for a commodity buyer: "
        f"Product={name}, Current forecast=${adjusted:.2f}/kg, "
        f"Expected change={'+' if change_pct >= 0 else ''}{change_pct:.1f}% in 30 days, "
        f"Trend={trend}, Key drivers={driver_text}. "
        f"Be direct. No markdown."
    )

    llm_result = _call_claude(prompt, max_tokens=80)
    if llm_result:
        return llm_result

    return _template_forecast_summary(product_id, base, adjusted, change_pct, trend, drivers)


def generate_opportunity_narrative(product_id: str, action: str, urgency: str,
                                   explanation: str, substitute_label: str = None) -> str:
    """Generate a purchasing recommendation narrative."""
    name = PRODUCT_NAMES.get(product_id, product_id.replace("_", " ").title())
    action_clean = action.replace("_", " ").title()
    sub_text = f" Consider switching to {substitute_label}." if substitute_label else ""

    prompt = (
        f"Write a concise purchasing recommendation (max 50 words) for a commodity trader: "
        f"Product={name}, Recommended action={action_clean}, Urgency={urgency}, "
        f"Situation={explanation}.{sub_text} "
        f"Be direct and practical. No markdown."
    )

    llm_result = _call_claude(prompt, max_tokens=100)
    if llm_result:
        return llm_result

    # Template fallback
    urgency_text = {"NOW": "immediately", "THIS_WEEK": "this week", "THIS_MONTH": "this month"}.get(urgency, urgency)
    base = f"Recommendation for {name}: {action_clean} {urgency_text}. {explanation}"
    if substitute_label:
        base += f" Alternative: {substitute_label}."
    return base
