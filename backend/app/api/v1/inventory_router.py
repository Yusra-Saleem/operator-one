from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.inventory import inventory_service

router = APIRouter(prefix="/inventory", tags=["Inventory Operations"])

class ReorderRequest(BaseModel):
    sku_or_id: str
    quantity: int = Field(50, ge=1, le=100000)

class CreateInventoryItemRequest(BaseModel):
    name: str
    sku: str | None = None
    category: str = "Abayas"
    quantity: int = Field(50, ge=0)
    unit_price: float = Field(45.0, ge=0.0)

class UpdateInventoryItemRequest(BaseModel):
    name: str | None = None
    quantity: int | None = None
    unit_price: float | None = None
    status: str | None = None

@router.get("/stock")
def get_inventory_stock():
    """Returns all inventory items."""
    return inventory_service.get_all_items()

@router.get("/health")
def get_inventory_health():
    """Returns inventory health score and critical alerts."""
    return inventory_service.get_inventory_health()

@router.post("/reorder")
def trigger_reorder(req: ReorderRequest):
    """Triggers an inventory reorder."""
    return inventory_service.trigger_reorder(req.sku_or_id, req.quantity)

@router.post("/item")
def create_inventory_item(req: CreateInventoryItemRequest):
    """Creates a new inventory item."""
    return inventory_service.add_item(req.name, req.sku, req.category, req.quantity, req.unit_price)

@router.put("/item/{sku_or_id}")
def update_inventory_item(sku_or_id: str, req: UpdateInventoryItemRequest):
    """Updates an existing inventory item."""
    return inventory_service.update_item(sku_or_id, req.quantity, req.unit_price, req.status, req.name)

@router.delete("/stock/{sku_or_id}")
@router.delete("/item/{sku_or_id}")
def delete_inventory_item(sku_or_id: str):
    """Deletes an item from inventory stock."""
    return inventory_service.delete_item(sku_or_id)
