from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RiskFactor(BaseModel):
    id: str
    category: str  # inventory, sales, financial, operational
    title: str
    severity: str  # critical, high, medium, low
    impact_score: int  # 1 to 100
    description: str
    affected_entity: str

class PredictiveRecommendation(BaseModel):
    id: str
    title: str
    category: str
    confidence_score: float  # e.g., 0.94
    impact_estimate: str
    explanation: str
    suggested_action: str
    grounded_data: Dict[str, Any]

class DecisionInsight(BaseModel):
    overall_risk_score: int  # 0 (perfect) to 100 (critical risk)
    active_risks_count: int
    top_recommendations: List[PredictiveRecommendation]
    risk_factors: List[RiskFactor]
    data_freshness: str
