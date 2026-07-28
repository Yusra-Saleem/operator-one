"""Integrations Specialist Agent for Operation One."""

import json
from typing import Any
from agents import Agent, function_tool, output_guardrail, GuardrailFunctionOutput, RunContextWrapper
from app.core.config import settings
from app.agent.tools.integration_tool import IntegrationSyncTool

MODEL = settings.openai_model


def _json(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump()
    elif hasattr(value, "dict"):
        value = value.dict()
    return json.dumps(value, default=str)


@function_tool
async def integration_sync(
    action: str = "list", connector_name: str | None = None, confirmed: bool = False
) -> str:
    """List, test, or synchronize CRM, ERP, accounting, and webhook connectors."""
    if action == "sync" and not confirmed:
        return "Confirmation required before synchronizing an external connector."
    inputs = IntegrationSyncTool.InputModel(action=action, connector_name=connector_name)
    return _json(await IntegrationSyncTool().execute(inputs))


@output_guardrail(name="integrations_response_safety")
async def integrations_response_safety(
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


integrations_agent = Agent(
    name="Operation One Integrations Agent",
    handoff_description="Handles CRM, ERP, accounting, connector, webhook, and sync requests.",
    instructions="You are a specialist inside Operation One managing enterprise integrations and synchronization. CRITICAL LANGUAGE DIRECTIVE: Match the language of the user's question. If asked in Roman Urdu, reply strictly in Roman Urdu. If asked in English, reply in English.",
    model=MODEL,
    tools=[integration_sync],
    output_guardrails=[integrations_response_safety],
)
