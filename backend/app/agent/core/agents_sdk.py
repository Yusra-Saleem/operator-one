"""Operation One's complete OpenAI Agents SDK graph.

This module imports modular specialists and owns SDK runner execution, sessions,
and voice pipeline integration.
"""

from __future__ import annotations

import json
from typing import Any, AsyncIterator

from agents import (
    Agent,
    Runner,
    SQLiteSession,
    set_default_openai_key,
)
from agents.voice import VoiceWorkflowBase, VoiceWorkflowHelper
from app.core.config import settings

from app.agent.agents.sales_agent import sales_agent
from app.agent.agents.inventory_agent import inventory_agent
from app.agent.agents.finance_agent import finance_agent
from app.agent.agents.integrations_agent import integrations_agent
from app.agent.agents.orchestrator_agent import operation_one_agent

set_default_openai_key(settings.openai_api_key.get_secret_value())

from app.services.business_ops import business_ops_service

# Backwards-compatibility aliases
business_agent = operation_one_agent
executive_agent = operation_one_agent


class OperationOneVoiceWorkflow(VoiceWorkflowBase):
    """Agents SDK voice workflow with a persistent per-session conversation."""

    def __init__(self, session_id: str) -> None:
        self.session = SQLiteSession(session_id)

    async def run(self, transcription: str) -> AsyncIterator[str]:
        result = Runner.run_streamed(
            operation_one_agent,
            transcription,
            session=self.session,
            max_turns=5,
        )
        async for text in VoiceWorkflowHelper.stream_text_from(result):
            yield text


async def run_agent(
    user_input: str,
    *,
    context: dict[str, Any] | None = None,
    agent: Agent[Any] = operation_one_agent,
    session_id: str | None = None,
) -> dict[str, Any]:
    """Run the Operation One handoff graph through the official SDK Runner."""
    session = SQLiteSession(session_id) if session_id else None
    result = await Runner.run(agent, user_input, context=context or {}, session=session, max_turns=5)
    last_agent_name = getattr(result.last_agent, "name", "OperationOneAgent")
    business_ops_service.log_agent_activity(last_agent_name, f"Processed command: '{user_input}'")
    return {
        "agent": last_agent_name,
        "response": str(result.final_output),
    }
