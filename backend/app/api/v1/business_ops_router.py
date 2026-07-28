from fastapi import APIRouter
from app.services.business_ops import business_ops_service

router = APIRouter(prefix="/operations", tags=["Business Operations"])

@router.get("/summary")
def get_executive_summary():
    """Returns top-level executive metrics and status."""
    return business_ops_service.get_executive_summary()

@router.get("/alerts")
def get_operational_alerts():
    """Returns active operational alerts."""
    return business_ops_service.get_alerts()

@router.get("/agent-activities")
def get_agent_activities():
    """Returns real-time agent execution telemetry logs."""
    return business_ops_service.get_agent_activities()
