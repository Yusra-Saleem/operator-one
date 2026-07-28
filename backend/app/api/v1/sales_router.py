from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.sales import sales_service

router = APIRouter(prefix="/sales", tags=["Sales Intelligence"])

class CreateDealRequest(BaseModel):
    client_name: str
    value: float = Field(..., gt=0, le=1_000_000_000)
    stage: str = "Lead"

class UpdateDealRequest(BaseModel):
    client_name: str | None = None
    value: float | None = None
    stage: str | None = None
    probability: int | None = None
    owner: str | None = None

@router.get("/deals")
def get_all_deals():
    """Returns all sales pipeline deals."""
    return sales_service.get_all_deals()

@router.get("/pipeline")
def get_pipeline_summary():
    """Returns aggregated sales pipeline metrics."""
    return sales_service.get_pipeline_summary()

@router.post("/deals")
def create_deal(req: CreateDealRequest):
    """Create a new sales deal."""
    return sales_service.add_deal(req.client_name, req.value, req.stage)

@router.put("/deals/{deal_id}")
def update_deal(deal_id: str, req: UpdateDealRequest):
    """Updates an existing sales deal."""
    return sales_service.update_deal(deal_id, req.value, req.stage, req.probability, req.owner)

@router.delete("/deals/{deal_id}")
def delete_deal(deal_id: str):
    """Deletes a deal from the sales pipeline."""
    return sales_service.delete_deal(deal_id)
