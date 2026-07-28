from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from .base import BaseTool, ToolMetadata
from .registry import register_tool
from app.services.sales import sales_service

class SalesToolInput(BaseModel):
    action: str = Field(..., description="Action to perform: 'pipeline_summary', 'list_deals', 'create_deal', 'update_deal', 'delete_deal'")
    client_name: Optional[str] = Field(None, description="Client name or Deal ID")
    value: Optional[float] = Field(None, description="Deal value in USD")
    stage: Optional[str] = Field(None, description="Deal stage, e.g. Qualified, Proposal, Negotiation, Closed Won, Closed Lost")
    probability: Optional[int] = Field(None, description="Deal win probability (0-100)")
    owner: Optional[str] = Field(None, description="Deal owner name")

class SalesToolOutput(BaseModel):
    success: bool
    result: Dict[str, Any]

@register_tool
class SalesAnalyticsTool(BaseTool):
    metadata = ToolMetadata(
        name="sales_analytics_tool",
        description="Query sales metrics, list deals, create new deals, update deal values/stages, or delete deals.",
        version="1.0"
    )
    InputModel = SalesToolInput
    OutputModel = SalesToolOutput

    async def execute(self, inputs: SalesToolInput) -> SalesToolOutput:
        if inputs.action == "pipeline_summary":
            res = sales_service.get_pipeline_summary()
            return SalesToolOutput(success=True, result=res)
        elif inputs.action == "list_deals":
            deals = [d.model_dump() for d in sales_service.get_all_deals()]
            return SalesToolOutput(success=True, result={"deals": deals})
        elif inputs.action in ("create_deal", "add_deal") and inputs.client_name:
            deal = sales_service.add_deal(inputs.client_name, inputs.value or 5000.0, inputs.stage or "Qualified")
            from app.services.business_ops import business_ops_service
            business_ops_service.trigger_workflow(f"Wholesale Processing - {inputs.client_name} (${inputs.value or 5000.0:,.0f})", triggered_by="Sales Agent")
            return SalesToolOutput(success=True, result={"deal": deal.model_dump()})
        elif inputs.action in ("update_deal", "edit_deal") and inputs.client_name:
            res = sales_service.update_deal(
                deal_id_or_client=inputs.client_name,
                value=inputs.value,
                stage=inputs.stage,
                probability=inputs.probability,
                owner=inputs.owner
            )
            from app.services.business_ops import business_ops_service
            business_ops_service.trigger_workflow(f"Deal Update ({inputs.stage or 'Updated'}) - {inputs.client_name}", triggered_by="Sales Agent")
            return SalesToolOutput(success=True, result=res)
        elif inputs.action in ("delete", "remove", "delete_deal", "remove_deal", "drop", "clear") and inputs.client_name:
            res = sales_service.delete_deal(inputs.client_name)
            return SalesToolOutput(success=True, result=res)
        else:
            client = inputs.client_name or "New Client"
            res = sales_service.update_deal(deal_id_or_client=client, value=inputs.value, stage=inputs.stage)
            return SalesToolOutput(success=True, result=res)
