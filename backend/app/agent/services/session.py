"""Session management for the agent.

Keeps track of active conversation sessions. Currently a thin wrapper around an
in‑memory dictionary, but the interface is designed for easy replacement with a
persistent store (Redis, database, etc.) in the future.
"""

from typing import Dict, Any

class SessionService:
    """Manage multiple concurrent conversation sessions.

    Each session is identified by a ``session_id`` string. The stored data is
    a generic dictionary that can hold any context information required by the
    orchestrator or other services.
    """

    def __init__(self) -> None:
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def get(self, session_id: str) -> Dict[str, Any]:
        """Retrieve the context dictionary for *session_id*.

        If the session does not exist it is created lazily.
        """
        return self._sessions.setdefault(session_id, {})

    def set(self, session_id: str, data: Dict[str, Any]) -> None:
        """Replace the entire context for *session_id* with *data*."""
        self._sessions[session_id] = data

    def update(self, session_id: str, updates: Dict[str, Any]) -> None:
        """Merge *updates* into the existing session context."""
        ctx = self.get(session_id)
        ctx.update(updates)
    def init_voice_session(self, session_id: str) -> None:
        """Initialize storage for a new voice session."""
        self._sessions.setdefault(session_id, {"transcriptions": []})

    def add_transcription(self, session_id: str, text: str) -> None:
        """Append a transcribed text chunk to the session's transcript list."""
        ctx = self._sessions.setdefault(session_id, {"transcriptions": []})
        ctx.setdefault("transcriptions", []).append(text)

    def get_transcript(self, session_id: str) -> str:
        """Return the concatenated transcript for the given session."""
        ctx = self._sessions.get(session_id, {"transcriptions": []})
        return " ".join(ctx.get("transcriptions", []))

