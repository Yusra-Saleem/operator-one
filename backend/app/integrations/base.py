from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime

class ConnectorStatus(BaseModel):
    name: str
    category: str
    connected: bool
    last_sync: Optional[str] = None
    health_status: str  # Healthy, Warning, Error, Disconnected
    metrics_synced_count: int = 0

class BaseConnector(ABC):
    """Abstract base class for all enterprise connectors."""

    name: str
    category: str  # crm, erp, finance, webhook, database

    @abstractmethod
    async def test_connection(self) -> bool:
        """Test authentication and network connectivity to external enterprise system."""
        raise NotImplementedError

    @abstractmethod
    async def sync_data(self) -> Dict[str, Any]:
        """Perform data synchronization and return metrics summary."""
        raise NotImplementedError

    @abstractmethod
    def get_status(self) -> ConnectorStatus:
        """Return standardized connector health and status metrics."""
        raise NotImplementedError
