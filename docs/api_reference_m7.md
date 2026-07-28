# API Reference — Milestone 7 Enterprise Business Operations

## Base URL
`http://localhost:8000/api/v1`

---

## Endpoints Summary

### Business Operations
- **`GET /operations/summary`**: Returns top-level executive metrics (MRR, ARR, active deals, inventory health score, operational readiness).
- **`GET /operations/alerts`**: Returns active operational risk alerts.

### Sales Intelligence
- **`GET /sales/deals`**: List all sales pipeline deals.
- **`GET /sales/pipeline`**: Aggregated sales metrics (total pipeline value, weighted value, deals by stage).
- **`POST /sales/deals`**: Create a new deal (`client_name`, `value`, `stage`).

### Inventory Operations
- **`GET /inventory/stock`**: List all inventory items.
- **`GET /inventory/health`**: Inventory health score, low stock items, out-of-stock items.
- **`POST /inventory/reorder`**: Trigger stock reorder (`sku_or_id`, `quantity`).

### Workflows & Analytics
- **`GET /workflows/active`**: List active business workflows.
- **`POST /workflows/trigger`**: Trigger a new business workflow (`name`).
- **`GET /workflows/analytics`**: Return comprehensive business analytics.

### Agent Execution
- **`POST /agent/execute`**: Submit natural language query or voice transcript for multi-agent autonomous planning and tool execution.
