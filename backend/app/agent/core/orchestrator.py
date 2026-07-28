"""Compatibility facade for the Operation One Agents SDK graph."""

from typing import Any

from ..models import AgentRequest
from .agents_sdk import run_agent


class Orchestrator:
    """Delegate every text request to the official Operation One SDK runner."""

    async def execute(self, request: AgentRequest, *, user: dict[str, Any]) -> dict[str, Any]:
        return await run_agent(request.user_input, context=user)
