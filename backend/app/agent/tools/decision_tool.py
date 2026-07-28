from pydantic import BaseModel, Field
from typing import Dict, Any
from .base import BaseTool, ToolMetadata
from .registry import register_tool
from app.engine.decision_engine import decision_engine

class DecisionToolInput(BaseModel):
    query_type: str = Field("all", description="Query type: 'all', 'risks', 'recommendations'")

class DecisionToolOutput(BaseModel):
    success: bool
    result: Dict[str, Any]

@register_tool
class DecisionEngineTool(BaseTool):
    metadata = ToolMetadata(
        name="decision_engine_tool",
        description="Evaluate business operational risks, calculate risk scores, and generate confidence-weighted recommendations.",
        version="1.0"
    )
    InputModel = DecisionToolInput
    OutputModel = DecisionToolOutput

    async def execute(self, inputs: DecisionToolInput) -> DecisionToolOutput:
        insight = decision_engine.evaluate_business_risks()
        return DecisionToolOutput(success=True, result=insight.model_dump())
