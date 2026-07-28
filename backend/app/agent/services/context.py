import os
from typing import Dict, Any

class ContextService:
    """In‑memory conversation context store.

    The implementation is deliberately simple – a dict keyed by
    ``session_id`` that holds arbitrary context data.  It can be swapped
    out later for a Redis or database backed store without affecting the
    rest of the system.
    """

    def __init__(self) -> None:
        self._store: Dict[str, Dict[str, Any]] = {}

    def get_context(self, session_id: str) -> Dict[str, Any]:
        """Return the stored context for *session_id*.

        If no context exists a new empty dict is created and returned.
        """
        return self._store.setdefault(session_id, {})

    def update_context(self, session_id: str, updates: Dict[str, Any]) -> None:
        """Merge *updates* into the existing context for *session_id*."""
        ctx = self.get_context(session_id)
        ctx.update(updates)
