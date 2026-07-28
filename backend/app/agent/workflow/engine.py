import asyncio
from typing import Any, Dict, List

from ..tools.registry import get_tool
from .models import WorkflowPlan, WorkflowResult, StepResult

class WorkflowEngine:
    """Engine to execute a :class:`WorkflowPlan`.

    It iterates over the steps, validates input against the tool's ``InputModel``
    and calls ``tool.execute``. Execution stops on the first failure (as per
    the chosen error‑handling policy). The engine aggregates a
    :class:`WorkflowResult` containing a history of each step.
    """

    def __init__(self, *, abort_on_error: bool = True):
        self.abort_on_error = abort_on_error

    async def run(self, plan: WorkflowPlan) -> WorkflowResult:
        history: List[StepResult] = []
        final_output: Any = None
        for step in plan.steps:
            tool_name = step.tool
            if not tool_name:
                # Skip steps without a tool – treat as no‑op
                history.append(
                    StepResult(
                        step_number=step.step_number,
                        tool=None,
                        inputs=step.params,
                        output=None,
                        success=True,
                    )
                )
                continue
            try:
                tool_cls = get_tool(tool_name)
                tool = tool_cls()
                input_model = tool.InputModel(**(step.params or {}))
                output = await tool.execute(input_model)
                success = True
                err_msg = None
                final_output = output
            except Exception as exc:
                output = None
                success = False
                err_msg = str(exc)
                if self.abort_on_error:
                    # Record failure and break
                    history.append(
                        StepResult(
                            step_number=step.step_number,
                            tool=tool_name,
                            inputs=step.params,
                            output=None,
                            success=False,
                            error=err_msg,
                        )
                    )
                    break
            # Record step result
            history.append(
                StepResult(
                    step_number=step.step_number,
                    tool=tool_name,
                    inputs=step.params,
                    output=output,
                    success=success,
                    error=err_msg,
                )
            )
            if not success and self.abort_on_error:
                break
        return WorkflowResult(execution_history=history, final_output=final_output)
