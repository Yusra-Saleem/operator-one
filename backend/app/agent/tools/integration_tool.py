from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from .base import BaseTool, ToolMetadata
from .registry import register_tool
from app.integrations.registry import integration_registry

class IntegrationToolInput(BaseModel):
    action: str = Field(..., description="Action: 'list', 'test', 'sync'")
    connector_name: Optional[str] = Field(None, description="Connector name to sync")

class IntegrationToolOutput(BaseModel):
    success: bool
    result: Dict[str, Any]

@register_tool
class IntegrationSyncTool(BaseTool):
    metadata = ToolMetadata(
        name="integration_sync_tool",
        description="Inspect enterprise connectors, test system connectivity, and sync CRM, ERP, or Accounting data.",
        version="1.0"
    )
    InputModel = IntegrationToolInput
    OutputModel = IntegrationToolOutput

    async def execute(self, inputs: IntegrationToolInput) -> IntegrationToolOutput:
        if inputs.action == "list":
            statuses = [c.model_dump() for c in integration_registry.list_connectors()]
            return IntegrationToolOutput(success=True, result={"connectors": statuses})
        elif inputs.action == "test":
            res = await integration_registry.test_all()
            return IntegrationToolOutput(success=True, result={"test_results": res})
        elif inputs.action == "sync" and inputs.connector_name:
            res = await integration_registry.sync_connector(inputs.connector_name)
            return IntegrationToolOutput(success=res.get("success", True), result=res)
        else:
            return IntegrationToolOutput(success=False, result={"error": f"Invalid action: {inputs.action}"})
