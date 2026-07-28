"""API schemas for Operation One agent requests."""

from typing import Any

from pydantic import BaseModel, Field


class AgentRequest(BaseModel):
    """A text command or speech transcription sent to Operation One."""

    user_input: str = Field(..., min_length=1, max_length=12000)
    session_id: str | None = Field(default=None, description="Persistent conversation session ID for turn memory")
    metadata: dict[str, Any] | None = None
