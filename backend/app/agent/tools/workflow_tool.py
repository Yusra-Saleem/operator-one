from pydantic import BaseModel, Field
from typing import Dict, Any
from .base import BaseTool, ToolMetadata
from .registry import register_tool
from app.services.business_ops import business_ops_service

class WorkflowToolInput(BaseModel):
    workflow_name: str = Field(..., description="Name of the business workflow to execute")

class WorkflowToolOutput(BaseModel):
    success: bool
    result: Dict[str, Any]

@register_tool
class WorkflowExecutionTool(BaseTool):
    metadata = ToolMetadata(
        name="workflow_execution_tool",
        description="Trigger business workflow automation (e.g. audit sign-off, client onboarding, inventory reorder).",
        version="1.0"
    )
    InputModel = WorkflowToolInput
    OutputModel = WorkflowToolOutput

    async def execute(self, inputs: WorkflowToolInput) -> WorkflowToolOutput:
        wf = business_ops_service.trigger_workflow(inputs.workflow_name, triggered_by="Agent Autonomous System")
        return WorkflowToolOutput(success=True, result={"workflow": wf.model_dump()})
