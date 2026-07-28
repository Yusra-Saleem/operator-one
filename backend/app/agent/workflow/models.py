from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class WorkflowStep(BaseModel):
    """Definition of a single step in a workflow.

    * ``tool`` – name of the tool to invoke (must be registered).
    * ``params`` – raw input dictionary for the tool.
    """
    step_number: int
    description: str
    tool: Optional[str] = None
    params: Optional[Dict[str, Any]] = None

class WorkflowPlan(BaseModel):
    """A full workflow consisting of ordered steps."""
    steps: List[WorkflowStep]

class StepResult(BaseModel):
    step_number: int
    tool: Optional[str]
    inputs: Optional[Dict[str, Any]]
    output: Optional[Any]
    success: bool
    error: Optional[str] = None

class WorkflowResult(BaseModel):
    """Aggregated result of executing a workflow."""
    execution_history: List[StepResult]
    final_output: Optional[Any] = None
