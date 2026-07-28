from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.integrations.registry import integration_registry

router = APIRouter(prefix="/integrations", tags=["Enterprise Integrations"])

class SyncRequest(BaseModel):
    connector_name: str

class WebhookPayload(BaseModel):
    event: str
    source: str
    data: Dict[str, Any]

@router.get("")
def list_integrations():
    """List all registered enterprise system connectors and health statuses."""
    return integration_registry.list_connectors()

@router.post("/test")
async def test_integrations():
    """Test connectivity for all registered connectors."""
    return await integration_registry.test_all()

@router.post("/sync")
async def sync_connector(req: SyncRequest):
    """Trigger manual data synchronization for a connector."""
    return await integration_registry.sync_connector(req.connector_name)

@router.post("/webhook")
def receive_webhook(payload: WebhookPayload):
    """Inbound webhook event receiver."""
    return {
        "received": True,
        "event": payload.event,
        "source": payload.source,
        "status": "processed"
    }
