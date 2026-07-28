from typing import Dict, Any
from .base import BaseConnector, ConnectorStatus
from app.core.database import db_manager
from app.services.inventory import inventory_service

class ERPConnector(BaseConnector):
    """Native Supabase Inventory & Supply Chain ERP Connector."""

    name = "Supabase PostgreSQL ERP & Warehouse"
    category = "erp"

    def __init__(self):
        self._last_sync = "Just now"

    async def test_connection(self) -> bool:
        return db_manager.check_connection()

    async def sync_data(self) -> Dict[str, Any]:
        connected = db_manager.check_connection()
        items = inventory_service.get_all_items()
        self._last_sync = "Just now"
        return {
            "success": connected,
            "connector": self.name,
            "synced_records": len(items),
            "details": f"Synchronized {len(items)} stock SKUs directly with Supabase PostgreSQL."
        }

    def get_status(self) -> ConnectorStatus:
        connected = db_manager.check_connection()
        count = 0
        if connected:
            try:
                items = inventory_service.get_all_items()
                count = len(items)
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

