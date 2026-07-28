from typing import Dict, Any
from .base import BaseConnector, ConnectorStatus
from app.core.database import db_manager
from app.services.business_ops import business_ops_service

class AccountingConnector(BaseConnector):
    """Native Supabase Financials & Operational Workflows Connector."""

    name = "Supabase PostgreSQL Financials & Operations"
    category = "finance"

    def __init__(self):
        self._last_sync = "Just now"

    async def test_connection(self) -> bool:
        return db_manager.check_connection()

    async def sync_data(self) -> Dict[str, Any]:
        connected = db_manager.check_connection()
        summary = business_ops_service.get_executive_summary()
        self._last_sync = "Just now"
        return {
            "success": connected,
            "connector": self.name,
            "synced_records": summary.open_alerts_count + summary.pending_approvals_count,
            "details": f"Synchronized MRR (${summary.mrr:,.2f}) and ARR (${summary.arr:,.2f}) metrics directly with Supabase PostgreSQL."
        }

    def get_status(self) -> ConnectorStatus:
        connected = db_manager.check_connection()
        count = 0
        if connected:
            try:
                summary = business_ops_service.get_executive_summary()
                count = summary.open_alerts_count + summary.pending_approvals_count
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

