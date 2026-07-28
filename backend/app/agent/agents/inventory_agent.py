"""Inventory Specialist Agent for Operation One."""

import json
from typing import Any
from agents import Agent, function_tool, output_guardrail, GuardrailFunctionOutput, RunContextWrapper
from app.core.config import settings
from app.agent.tools.inventory_tool import InventoryManagementTool
from app.agent.tools.workflow_tool import WorkflowExecutionTool

MODEL = settings.openai_model


def _json(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump()
    elif hasattr(value, "dict"):
        value = value.dict()
    return json.dumps(value, default=str)


@function_tool
async def inventory_management(
    action: str = "health",
    sku_or_id: str | None = None,
    name: str | None = None,
    category: str = "Abayas",
    quantity: int = 50,
    unit_price: float = 45.0,
    status: str | None = None,
    confirmed: bool = True,
) -> str:
    """Check stock, list items, reorder, add new items, update stock quantity/price, or delete stock items."""
    inputs = InventoryManagementTool.InputModel(
        action=action,
        sku_or_id=sku_or_id,
        name=name,
        category=category,
        quantity=quantity,
        unit_price=unit_price,
        status=status
    )
    return _json(await InventoryManagementTool().execute(inputs))


@function_tool
async def trigger_workflow(workflow_name: str, confirmed: bool = True) -> str:
    """Trigger a named business workflow after the user has clearly requested it."""
    inputs = WorkflowExecutionTool.InputModel(workflow_name=workflow_name)
    return _json(await WorkflowExecutionTool().execute(inputs))


@output_guardrail(name="inventory_response_safety")
async def inventory_response_safety(
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


INVENTORY_DIRECTIVE = """You are an inventory specialist inside Operation One managing stock for Abayas, Scarfs, Niqabs, and Hijab Caps.
1. SEARCH & RESEARCH FIRST: For every query, call inventory_management tool to search real PostgreSQL database stock lists, valuations, and quantities. Never state information is missing without calling the tool.
2. CONVERSATIONAL DETAIL GATHERING & CONFIRMATION:
   - For ADD or EDIT requests (e.g., 'Add new Velvet Abaya'), if required fields (item name, quantity, unit price) are missing, conversationally ask the user to provide the missing fields before executing the database change.
   - For DELETE requests (e.g., 'Delete Silk Cap'), ask the user for explicit confirmation (e.g., 'Are you sure you want to delete Silk Cap from inventory? Please confirm.') before executing deletion, unless the user explicitly confirmed in their request.
   - When all details are provided, execute the action immediately and confirm the result.
3. STRICT PER-TURN LANGUAGE MATCH DIRECTIVE: Inspect the language of the user query:
   - If Roman Urdu (e.g. 'total Abaya inventory stock kitna hai'), you MUST answer 100% IN NATURAL ROMAN URDU (e.g. 'Scarfs ka total stock 190 units hai').
   - If English, answer 100% IN ENGLISH.
4. CLEAN SPOKEN CONVERSATIONAL FORMAT: Output smooth conversational spoken sentences. State exact quantities, prices, and status clearly.
5. NO EMOJIS: Do NOT include any emojis, emoticons, or icons in your responses under any circumstances.
6. STRUCTURED FORMATTING: Use **bold** text for key stock numbers and item names, and use clear line breaks for lists."""

inventory_agent = Agent(
    name="Operation One Inventory Agent",
    handoff_description="Handles stock queries, valuations, stock additions, price updates, edits, and reorder questions for Abayas, Scarfs, Niqabs, and Hijab Caps.",
    instructions=INVENTORY_DIRECTIVE,
    model=MODEL,
    tools=[inventory_management, trigger_workflow],
    output_guardrails=[inventory_response_safety],
)
