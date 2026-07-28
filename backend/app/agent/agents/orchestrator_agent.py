"""Master Orchestrator Agent for Operation One."""

import json
from typing import Any
from agents import (
    Agent,
    Handoff,
    RunContextWrapper,
    function_tool,
    handoff,
    input_guardrail,
    output_guardrail,
    GuardrailFunctionOutput,
)
from app.core.config import settings
from app.agent.tools.dispatch_tool import DispatchTool
from app.agent.agents.sales_agent import sales_agent
from app.agent.agents.inventory_agent import inventory_agent
from app.agent.agents.finance_agent import finance_agent
from app.agent.agents.integrations_agent import integrations_agent

MODEL = settings.openai_model


def _json(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump()
    elif hasattr(value, "dict"):
        value = value.dict()
    return json.dumps(value, default=str)


@function_tool
async def dispatch_document(
    channel: str = "whatsapp",
    document_type: str = "quote",
    recipient_name: str = "Valued Client",
    recipient_contact: str = "+923001234567",
    amount: float = 0.0,
    details: str = "",
) -> str:
    """Send quotes, invoices, or reminders via WhatsApp or Email. Supports Roman Urdu and English commands."""
    return _json(
        DispatchTool().run(
            channel=channel,
            document_type=document_type,
            recipient_name=recipient_name,
            recipient_contact=recipient_contact,
            amount=amount,
            details=details,
        )
    )


@input_guardrail(name="business_request_safety")
async def business_request_safety(
    _ctx: RunContextWrapper[Any],
    _agent: Agent[Any],
    input: str | list[Any],
) -> GuardrailFunctionOutput:
    """Reject empty requests and obvious attempts to override agent policy."""
    raw = input if isinstance(input, str) else json.dumps(input, default=str)
    lowered = raw.lower().strip()
    injection_markers = ("ignore previous instructions", "reveal system prompt", "bypass guardrail")
    blocked = not lowered or any(marker in lowered for marker in injection_markers)
    return GuardrailFunctionOutput(
        output_info={"reason": "unsafe_or_empty_request" if blocked else "accepted"},
        tripwire_triggered=blocked,
    )


@output_guardrail(name="operation_one_response_safety")
async def operation_one_response_safety(
    _ctx: RunContextWrapper[Any],
    _agent: Agent[Any],
    output: Any,
) -> GuardrailFunctionOutput:
    """Prevent secrets and excessively long spoken responses from leaving the agent."""
    text = str(output)
    secret_like = "sk-" in text or "api_key" in text.lower() or "service_role" in text.lower()
    too_long_for_voice = len(text) > 8000
    return GuardrailFunctionOutput(
        output_info={"length": len(text), "safe": not (secret_like or too_long_for_voice)},
        tripwire_triggered=secret_like or too_long_for_voice,
    )


def _handoff(agent: Agent[Any]) -> Handoff[Any, Any]:
    return handoff(agent=agent, tool_description_override=agent.handoff_description)


def build_orchestrator_instructions(store_name: str = "Operation One Store", store_domain: str = "Abaya & Modest Wear Boutique Store (selling Abayas, Scarfs, Niqabs, Hijab Caps, and accessories)") -> str:
    return f"""You are Operation One, an executive voice AI operations manager for {store_name} ({store_domain}).
AUTONOMOUS RESEARCH & ACTION DIRECTIVE:
1. RESEARCH & SEARCH FIRST: For every query, automatically search and inspect backend databases, inventory stock lists, sales deals, and store metrics using your tools. Never claim information is unavailable without calling your research/read tools first.
2. CONVERSATIONAL DETAIL GATHERING & CONFIRMATION:
   - When a user asks to add, edit, or delete items/deals with incomplete details, conversationally ask the user for the missing fields (e.g. quantity, unit price, client name, deal value) before executing database modifications.
   - Ask for confirmation before performing deletion operations.
   - Once all details are provided, execute the requested action immediately and present a clear summary.
3. STRICT PER-TURN LANGUAGE DIRECTIVE:
   - If user asks in ENGLISH, your entire response MUST be 100% IN ENGLISH.
   - If user asks in ROMAN URDU, your entire response MUST be 100% IN NATURAL ROMAN URDU.
4. BEAUTIFUL STRUCTURED FORMATTING: Format responses clearly using line breaks, numbered points, or bullet lists (-) when presenting stock lists, metrics, or action summaries.
5. COMPLETE ANSWER: State exact numbers, quantities, prices, deal values, and explain both the researched facts and the completed action clearly.
6. NO EMOJIS: Do NOT include any emojis, emoticons, or decorative icons in your text or spoken responses.
7. STRUCTURED FORMATTING: Use **bold** text for key numbers, prices, and client names, and use clean line breaks or hyphenated bullet lists (- ) for itemized lists."""


operation_one_agent = Agent(
    name="Operation One Business Operations Manager",
    instructions=build_orchestrator_instructions(),
    model=MODEL,
    tools=[dispatch_document],
    handoffs=[
        _handoff(sales_agent),
        _handoff(inventory_agent),
        _handoff(finance_agent),
        _handoff(integrations_agent),
    ],
    input_guardrails=[business_request_safety],
    output_guardrails=[operation_one_response_safety],
)
