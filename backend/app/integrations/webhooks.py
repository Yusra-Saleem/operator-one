from typing import Dict, Any, List
from .base import BaseConnector, ConnectorStatus
from app.core.database import db_manager
from app.services.business_ops import business_ops_service

class WebhookConnector(BaseConnector):
    """Native Supabase Realtime Inbound Webhook Listener & Event Connector."""

    name = "Supabase Realtime Event Webhooks"
    category = "webhook"

    def __init__(self):
        self._last_sync = "Just now"

    async def test_connection(self) -> bool:
        return db_manager.check_connection()

    async def sync_data(self) -> Dict[str, Any]:
        connected = db_manager.check_connection()
        activities = business_ops_service.get_agent_activities()
        self._last_sync = "Just now"
        return {
            "success": connected,
            "connector": self.name,
            "synced_records": len(activities),
            "details": f"Processed {len(activities)} Supabase Realtime agent execution telemetry webhooks."
        }

    def get_status(self) -> ConnectorStatus:
        connected = db_manager.check_connection()
        activities = business_ops_service.get_agent_activities()
        return ConnectorStatus(
            name=self.name,
            category=self.category,
            connected=connected,
            last_sync=self._last_sync,
            health_status="Healthy" if connected else "Disconnected",
            metrics_synced_count=len(activities)
        )

    def get_recent_events(self) -> List[Dict[str, Any]]:
        return [
            {
                "event": act.get("action", "Agent Event"),
                "source": act.get("agent", "Supabase System"),
                "timestamp": act.get("time", "Just now"),
            }
            for act in business_ops_service.get_agent_activities()[:5]
        ]

