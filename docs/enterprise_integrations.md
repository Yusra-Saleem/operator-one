# Enterprise Integration Framework Architecture

## Overview
Operator One includes a standardized **Enterprise Connector Framework** (`backend/app/integrations/`) enabling seamless synchronization with CRM, ERP, Accounting, SQL Databases, and Webhooks without coupling core business logic to external vendors.

---

## Connector Hierarchy

```mermaid
graph TD
    BaseConnector[BaseConnector Interface] --> CRM[CRMConnector - Salesforce / HubSpot]
    BaseConnector --> ERP[ERPConnector - Oracle NetSuite / SAP]
    BaseConnector --> Finance[AccountingConnector - QuickBooks / Xero]
    BaseConnector --> Webhooks[WebhookConnector - Inbound Events]

    Registry[IntegrationRegistry] --> BaseConnector
    API[/api/v1/integrations] --> Registry
```

---

## Standardized Connector Methods

Every connector implements the abstract class `BaseConnector`:

1. `test_connection() -> bool`: Verifies API key, OAuth token, and endpoint health.
2. `sync_data() -> Dict[str, Any]`: Synchronizes records and updates metrics.
3. `get_status() -> ConnectorStatus`: Returns standardized health metrics and last sync timestamps.

---

## Adding Custom Connectors

To register a new enterprise system (e.g. PostgreSQL or Snowflake):

```python
from app.integrations.base import BaseConnector, ConnectorStatus

class CustomDBConnector(BaseConnector):
    name = "Custom PostgreSQL Connector"
    category = "database"

    async def test_connection(self) -> bool:
        return True

    async def sync_data(self) -> dict:
        return {"success": True, "synced_records": 100}

    def get_status(self) -> ConnectorStatus:
        return ConnectorStatus(
            name=self.name,
            category=self.category,
            connected=True,
            last_sync="Just now",
            health_status="Healthy",
            metrics_synced_count=100
        )
```
