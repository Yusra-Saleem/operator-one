from typing import Dict, Any
from .base import BaseConnector, ConnectorStatus
from app.core.database import db_manager
from app.services.sales import sales_service

class CRMConnector(BaseConnector):
    """Native Supabase Relational CRM & Sales Deals Connector."""

    name = "Supabase PostgreSQL CRM"
    category = "crm"

    def __init__(self):
        self._last_sync = "Just now"

    async def test_connection(self) -> bool:
        return db_manager.check_connection()

    async def sync_data(self) -> Dict[str, Any]:
        connected = db_manager.check_connection()
        deals = sales_service.get_all_deals()
        self._last_sync = "Just now"
        return {
            "success": connected,
            "connector": self.name,
            "synced_records": len(deals),
            "details": f"Synchronized {len(deals)} live deals directly with Supabase PostgreSQL."
        }

    def get_status(self) -> ConnectorStatus:
        connected = db_manager.check_connection()
        count = 0
        if connected:
            try:
                deals = sales_service.get_all_deals()
                count = len(deals)
            except Exception:
                connected = False

        return ConnectorStatus(
            name=self.name,
            category=self.category,
            connected=connected,
            last_sync=self._last_sync,
            health_status="Healthy" if connected else "Disconnected",
            metrics_synced_count=count
        )

