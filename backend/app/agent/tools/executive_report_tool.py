from pydantic import BaseModel, Field
from typing import Dict, Any
from .base import BaseTool, ToolMetadata
from .registry import register_tool
from app.services.analytics import analytics_service

class ExecutiveReportToolInput(BaseModel):
    scope: str = Field("all", description="Scope of report: 'all', 'sales', 'inventory', 'operations'")

class ExecutiveReportToolOutput(BaseModel):
    success: bool
    result: Dict[str, Any]

@register_tool
class ExecutiveReportingTool(BaseTool):
    metadata = ToolMetadata(
        name="executive_reporting_tool",
        description="Generate comprehensive executive business analytics, operational performance scores, and risk analysis.",
        version="1.0"
    )
    InputModel = ExecutiveReportToolInput
    OutputModel = ExecutiveReportToolOutput

    async def execute(self, inputs: ExecutiveReportToolInput) -> ExecutiveReportToolOutput:
        analytics = analytics_service.get_comprehensive_analytics()
        return ExecutiveReportToolOutput(success=True, result=analytics)
