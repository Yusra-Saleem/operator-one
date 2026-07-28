from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.business_ops import business_ops_service
from app.services.analytics import analytics_service

router = APIRouter(prefix="/workflows", tags=["Workflows & Analytics"])

class TriggerWorkflowRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)

@router.get("", response_model=list)
@router.get("/", response_model=list)
@router.get("/active")
def get_active_workflows():
    """Returns list of active business workflows."""
    return business_ops_service.get_workflows()

@router.post("/trigger")
def trigger_workflow(req: TriggerWorkflowRequest):
    """Triggers an automated business workflow."""
    return business_ops_service.trigger_workflow(req.name)

@router.get("/analytics")
def get_analytics():
    """Returns comprehensive business analytics."""
    return analytics_service.get_comprehensive_analytics()
