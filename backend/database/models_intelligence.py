# backend/database/models_intelligence.py
# New tables for NICO Supply Intelligence Engine
# Add to existing models.py — these tables are created alongside the existing ones.

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()  # Use the same Base as existing models in production


# ═══════════════════════════════════════════════════════════
# TABLE 1 — risk_signals
# Stores computed risk score per product per run
# ═══════════════════════════════════════════════════════════
class RiskSignal(Base):
    __tablename__ = "risk_signals"

    id              = Column(Integer, primary_key=True, index=True)
    product_id      = Column(String, index=True, nullable=False)   # e.g. "dried_apricot"
    risk_score      = Column(Float, nullable=False)                 # 0–100
    availability    = Column(String, nullable=False)                # LOW / NORMAL / HIGH
    triggered_events= Column(JSON, nullable=True)                   # ["frost_event","heat_stress"]
    explanation     = Column(Text, nullable=True)                   # Human-readable reason
    timestamp       = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "product_id":       self.product_id,
            "risk_score":       round(self.risk_score, 1),
            "availability":     self.availability,
            "triggered_events": self.triggered_events or [],
            "explanation":      self.explanation,
            "timestamp":        self.timestamp.isoformat() if self.timestamp else None,
        }


# ═══════════════════════════════════════════════════════════
# TABLE 2 — weather_events
# One row per detected weather anomaly per region
# ═══════════════════════════════════════════════════════════
class WeatherEvent(Base):
    __tablename__ = "weather_events"

    id          = Column(Integer, primary_key=True, index=True)
    product_id  = Column(String, index=True, nullable=False)
    region      = Column(String, nullable=False)                    # e.g. "Turkey"
    event_type  = Column(String, nullable=False)                    # frost|heat|rain_anomaly|drought
    severity    = Column(String, nullable=False)                    # LOW / MEDIUM / HIGH / CRITICAL
    temperature = Column(Float, nullable=True)                      # actual temp that triggered
    threshold   = Column(Float, nullable=True)                      # threshold that was crossed
    crop_stage  = Column(String, nullable=True)                     # bloom|harvest|export
    date        = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "product_id":  self.product_id,
            "region":      self.region,
            "event_type":  self.event_type,
            "severity":    self.severity,
            "temperature": self.temperature,
            "threshold":   self.threshold,
            "crop_stage":  self.crop_stage,
            "date":        self.date.isoformat() if self.date else None,
        }


# ═══════════════════════════════════════════════════════════
# TABLE 3 — forecast_features
# Stores forecast output with features used and confidence
# ═══════════════════════════════════════════════════════════
class ForecastFeature(Base):
    __tablename__ = "forecast_features"

    id                  = Column(Integer, primary_key=True, index=True)
    product_id          = Column(String, index=True, nullable=False)
    features_json       = Column(JSON, nullable=True)               # raw input features
    base_forecast       = Column(Float, nullable=True)              # linear baseline USD/kg
    adjusted_forecast   = Column(Float, nullable=True)              # risk-adjusted USD/kg
    forecast_low        = Column(Float, nullable=True)              # low scenario
    forecast_high       = Column(Float, nullable=True)              # high scenario
    confidence_score    = Column(Float, nullable=True)              # 0–100
    trend               = Column(String, nullable=True)             # UP / DOWN / STABLE
    main_drivers        = Column(JSON, nullable=True)               # ["frost_turkey","USD_weakening"]
    timestamp           = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "product_id":        self.product_id,
            "base_forecast":     round(self.base_forecast, 3) if self.base_forecast else None,
            "adjusted_forecast": round(self.adjusted_forecast, 3) if self.adjusted_forecast else None,
            "forecast_low":      round(self.forecast_low, 3) if self.forecast_low else None,
            "forecast_high":     round(self.forecast_high, 3) if self.forecast_high else None,
            "confidence_score":  round(self.confidence_score, 1) if self.confidence_score else None,
            "trend":             self.trend,
            "main_drivers":      self.main_drivers or [],
            "timestamp":         self.timestamp.isoformat() if self.timestamp else None,
        }


# ═══════════════════════════════════════════════════════════
# TABLE 4 — product_substitutes
# Alternative sourcing options per product
# ═══════════════════════════════════════════════════════════
class ProductSubstitute(Base):
    __tablename__ = "product_substitutes"

    id                  = Column(Integer, primary_key=True, index=True)
    product_id          = Column(String, index=True, nullable=False)   # affected product
    substitute_product  = Column(String, nullable=False)               # e.g. "dried_apricot_uzbek"
    substitute_label    = Column(String, nullable=False)               # "Uzbekistan Dried Apricots"
    origin              = Column(String, nullable=False)               # "Uzbekistan"
    price_diff_pct      = Column(Float, nullable=True)                 # % more/less expensive
    availability_score  = Column(Float, nullable=True)                 # 0–100
    quality_match       = Column(String, nullable=True)                # EXACT / CLOSE / ACCEPTABLE
    reason              = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "product_id":         self.product_id,
            "substitute_product": self.substitute_product,
            "substitute_label":   self.substitute_label,
            "origin":             self.origin,
            "price_diff_pct":     self.price_diff_pct,
            "availability_score": self.availability_score,
            "quality_match":      self.quality_match,
            "reason":             self.reason,
        }


# ═══════════════════════════════════════════════════════════
# TABLE 5 — opportunity_flags
# Buy/wait/switch recommendations per product
# ═══════════════════════════════════════════════════════════
class OpportunityFlag(Base):
    __tablename__ = "opportunity_flags"

    id                   = Column(Integer, primary_key=True, index=True)
    product_id           = Column(String, index=True, nullable=False)
    opportunity_score    = Column(Float, nullable=False)             # 0–100
    recommended_action   = Column(String, nullable=False)            # BUY_EARLY|WAIT|SWITCH_ORIGIN|HOLD_STOCK
    action_label         = Column(String, nullable=True)             # human label
    forecast_change_pct  = Column(Float, nullable=True)             # expected % price change
    risk_score           = Column(Float, nullable=True)              # from risk_signals
    urgency              = Column(String, nullable=True)             # NOW / THIS_WEEK / THIS_MONTH
    explanation          = Column(Text, nullable=True)
    timestamp            = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "product_id":          self.product_id,
            "opportunity_score":   round(self.opportunity_score, 1),
            "recommended_action":  self.recommended_action,
            "action_label":        self.action_label,
            "forecast_change_pct": round(self.forecast_change_pct, 2) if self.forecast_change_pct else None,
            "risk_score":          round(self.risk_score, 1) if self.risk_score else None,
            "urgency":             self.urgency,
            "explanation":         self.explanation,
            "timestamp":           self.timestamp.isoformat() if self.timestamp else None,
        }
