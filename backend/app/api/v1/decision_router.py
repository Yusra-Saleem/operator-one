from fastapi import APIRouter
from app.engine.decision_engine import decision_engine

router = APIRouter(prefix="/decision", tags=["AI Decision Engine"])

@router.get("/insights")
def get_decision_insights():
    """Return overall operational risk score, risk factors, and predictive recommendations."""
    return decision_engine.evaluate_business_risks()

@router.get("/risks")
def get_risk_factors():
    """Return active risk factors detected across sales, inventory, and operations."""
    insight = decision_engine.evaluate_business_risks()
    return {
        "risk_score": insight.overall_risk_score,
        "risk_factors": insight.risk_factors,
        "recommendations": insight.top_recommendations,
    }

@router.get("/recommendations")
def get_recommendations():
    """Return confidence-weighted predictive recommendations."""
    insight = decision_engine.evaluate_business_risks()
    return insight.top_recommendations
