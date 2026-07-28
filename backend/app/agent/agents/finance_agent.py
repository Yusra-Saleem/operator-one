"""Finance & Risk Specialist Agent for Operation One."""

import json
from typing import Any
from agents import Agent, function_tool, output_guardrail, GuardrailFunctionOutput, RunContextWrapper
from app.core.config import settings
from app.agent.tools.decision_tool import DecisionEngineTool
from app.agent.tools.executive_report_tool import ExecutiveReportingTool
from app.agent.tools.calculator import CalculatorTool

MODEL = settings.openai_model


def _json(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump()
    elif hasattr(value, "dict"):
        value = value.dict()
    return json.dumps(value, default=str)


@function_tool
async def executive_report(scope: str = "all") -> str:
    """Generate an executive report for sales, inventory, operations, or all areas."""
    inputs = ExecutiveReportingTool.InputModel(scope=scope)
    return _json(await ExecutiveReportingTool().execute(inputs))


@function_tool
async def evaluate_business_risks(query_type: str = "all") -> str:
    """Evaluate operational risks and confidence-weighted recommendations."""
    inputs = DecisionEngineTool.InputModel(query_type=query_type)
    return _json(await DecisionEngineTool().execute(inputs))


@function_tool
async def calculate(expression: str) -> str:
    """Evaluate a basic arithmetic expression."""
    inputs = CalculatorTool.InputModel(expression=expression)
    return _json(await CalculatorTool().execute(inputs))


@output_guardrail(name="finance_response_safety")
async def finance_response_safety(
    _ctx: RunContextWrapper[Any],
    _agent: Agent[Any],
    output: Any,
) -> GuardrailFunctionOutput:
    text = str(output)
    secret_like = "sk-" in text or "api_key" in text.lower()
    return GuardrailFunctionOutput(
        output_info={"length": len(text), "safe": not secret_like},
        tripwire_triggered=secret_like,
    )


finance_agent = Agent(
    name="Operation One Finance and Risk Agent",
    handoff_description="Handles KPIs, risk, recommendations, analytics, and executive reporting.",
    instructions="You are a specialist inside Operation One handling financial metrics, risk evaluations, and executive reporting. CRITICAL LANGUAGE DIRECTIVE: Match the language of the user's question. If asked in Roman Urdu, reply strictly in Roman Urdu. If asked in English, reply in English.",
    model=MODEL,
    tools=[evaluate_business_risks, executive_report, calculate],
    output_guardrails=[finance_response_safety],
)
