from typing import List, Dict, Any
from .base import BaseConnector, ConnectorStatus
from .crm import CRMConnector
from .erp import ERPConnector
from .finance import AccountingConnector
from .webhooks import WebhookConnector

class IntegrationRegistry:
    """Registry managing enterprise system connectors."""

    def __init__(self):
        self._connectors: List[BaseConnector] = [
            CRMConnector(),
            ERPConnector(),
            AccountingConnector(),
            WebhookConnector()
        ]

    def list_connectors(self) -> List[ConnectorStatus]:
        return [c.get_status() for c in self._connectors]

    async def test_all(self) -> Dict[str, bool]:
        results = {}
        for c in self._connectors:
            results[c.name] = await c.test_connection()
        return results

    async def sync_connector(self, name: str) -> Dict[str, Any]:
        for c in self._connectors:
            if c.name.lower() == name.lower() or c.category.lower() == name.lower():
                return await c.sync_data()
        return {"success": False, "error": f"Connector '{name}' not found."}

integration_registry = IntegrationRegistry()
