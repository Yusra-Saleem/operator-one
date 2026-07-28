"""Sales Specialist Agent for Operation One."""

from agents import Agent
from app.core.config import settings
from app.agent.tools.sales_tool import SalesAnalyticsTool
from app.agent.tools.calculator import CalculatorTool
import json
from typing import Any
from agents import function_tool, output_guardrail, GuardrailFunctionOutput, RunContextWrapper

MODEL = settings.openai_model


def _json(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump()
    elif hasattr(value, "dict"):
        value = value.dict()
    return json.dumps(value, default=str)


@function_tool
async def sales_analytics(
    action: str = "pipeline_summary",
    client_name: str | None = None,
    value: float | None = None,
    stage: str | None = None,
    probability: int | None = None,
    owner: str | None = None,
    confirmed: bool = True,
) -> str:
    """Query sales pipeline, list deals, create deals, update deal values/stages, or delete sales deals."""
    inputs = SalesAnalyticsTool.InputModel(
        action=action,
        client_name=client_name,
        value=value,
        stage=stage,
        probability=probability,
        owner=owner
    )
    return _json(await SalesAnalyticsTool().execute(inputs))


@function_tool
async def calculate(expression: str) -> str:
    """Evaluate a basic arithmetic expression."""
    inputs = CalculatorTool.InputModel(expression=expression)
    return _json(await CalculatorTool().execute(inputs))


@output_guardrail(name="sales_response_safety")
async def sales_response_safety(
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


SPECIALIST_INSTRUCTIONS = """You are a sales specialist inside Operation One for an Abaya & Modest Wear store (Abayas, Scarfs, Niqabs, Hijab Caps).
1. SEARCH & RESEARCH FIRST: Call sales_analytics tool to query real pipeline metrics, total revenue, active deal counts, and stage progress. Never claim data is missing without searching first.
2. CONVERSATIONAL DETAIL GATHERING & CONFIRMATION:
   - For CREATE or UPDATE deal requests (e.g. 'Create a sales deal'), if required details (client name, deal value, stage) are missing, conversationally ask the user to specify the missing fields before executing tool mutations.
   - For DELETE deal requests, ask the user for explicit confirmation before deleting.
   - When all details are specified, execute the sales tool action immediately and confirm the result.
3. LANGUAGE MATCH & CLEAN FORMAT: Respond 100% in English for English queries, and 100% in natural Roman Urdu for Roman Urdu queries.
4. NO EMOJIS: Do NOT use any emojis, emoticons, or icons in your responses under any circumstances.
5. STRUCTURED FORMATTING: Use **bold** text for key deal amounts and client names, and use clear line breaks for lists."""

sales_agent = Agent(
    name="Operation One Sales Agent",
    handoff_description="Handles pipeline, deals, leads, revenue, sales additions, updates, and deal modifications.",
    instructions=SPECIALIST_INSTRUCTIONS + " Focus on sales analytics, deal execution, and customer pipeline.",
    model=MODEL,
    tools=[sales_analytics, calculate],
    output_guardrails=[sales_response_safety],
)
