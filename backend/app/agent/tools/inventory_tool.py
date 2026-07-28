from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from .base import BaseTool, ToolMetadata
from .registry import register_tool
from app.services.inventory import inventory_service

class InventoryToolInput(BaseModel):
    action: str = Field(..., description="Action to perform: 'health', 'list_stock', 'reorder', 'add', 'update', 'delete'")
    sku_or_id: Optional[str] = Field(None, description="SKU, Item ID, or item name for searching or updating")
    name: Optional[str] = Field(None, description="Name of the item when adding or updating")
    category: Optional[str] = Field("Abayas", description="Item category, e.g. Abayas, Scarfs, Niqabs, Hijab Caps")
    quantity: Optional[int] = Field(50, ge=0, le=100000, description="Stock quantity")
    unit_price: Optional[float] = Field(45.0, description="Unit price per item")
    status: Optional[str] = Field(None, description="Stock status, e.g. 'In Stock', 'Low Stock', 'Out of Stock'")

class InventoryToolOutput(BaseModel):
    success: bool
    result: Dict[str, Any]

@register_tool
class InventoryManagementTool(BaseTool):
    metadata = ToolMetadata(
        name="inventory_management_tool",
        description="Check total inventory stock, search stock by category or item name, add items, update stock levels, delete items, and trigger reorders.",
        version="1.0"
    )
    InputModel = InventoryToolInput
    OutputModel = InventoryToolOutput

    async def execute(self, inputs: InventoryToolInput) -> InventoryToolOutput:
        act = (inputs.action or "list_stock").lower().strip()
        query_target = (inputs.sku_or_id or inputs.name or inputs.category or "").lower().strip()

        # Query & Read Actions
        if act in ("list_stock", "get_stock", "check_stock", "query", "stock", "health", "total_stock", "list", "show", "read", "view", "valuation", "inventory_valuation", "total_valuation", "worth", "value", "total_value", "cost", "analytics", "metrics", "summary") or (not inputs.action and not inputs.quantity and not inputs.unit_price):
            all_items = [i.model_dump() for i in inventory_service.get_all_items()]
            health = inventory_service.get_inventory_health()

            # Filter by item name or category if search query is passed (e.g. "abaya", "scarf", "niqab")
            if query_target and query_target not in ("all", "stock", "items", "health", "valuation", "total_valuation", "worth"):
                filtered = [
                    item for item in all_items
                    if query_target in item["name"].lower() or query_target in item["category"].lower() or query_target in item["sku"].lower()
                ]
                target_items = filtered if filtered else all_items
            else:
                target_items = all_items

            total_qty = sum(item["quantity"] for item in target_items)
            total_valuation = sum(item["quantity"] * float(item["unit_price"]) for item in target_items)
            breakdown = ", ".join([f"{item['name']} ({item['quantity']} units @ ${item['unit_price']})" for item in target_items])
            summary_msg = f"Total stock count is {total_qty} units across {len(target_items)} items with a total inventory valuation of ${total_valuation:,.2f}. Items: {breakdown}."

            return InventoryToolOutput(
                success=True,
                result={
                    "total_stock_quantity": total_qty,
                    "total_inventory_valuation": total_valuation,
                    "total_inventory_valuation_usd": f"${total_valuation:,.2f}",
                    "items_count": len(target_items),
                    "items": target_items,
                    "summary": summary_msg,
                    "health": health,
                    "health_score": health.get("health_score", 100),
                }
            )

        elif act == "reorder" and inputs.sku_or_id:
            res = inventory_service.trigger_reorder(inputs.sku_or_id, inputs.quantity or 50)
            from app.services.business_ops import business_ops_service
            business_ops_service.trigger_workflow(f"Auto Reorder - {inputs.sku_or_id} (+{inputs.quantity or 50} units)", triggered_by="Inventory Agent")
            return InventoryToolOutput(success=res["success"], result=res)

        elif act in ("add", "create", "new"):
            item_name = inputs.name or inputs.sku_or_id or "New Modest Wear Item"
            res = inventory_service.add_item(
                name=item_name,
                sku=inputs.sku_or_id if inputs.sku_or_id and "SKU" in inputs.sku_or_id else None,
                category=inputs.category or "Abayas",
                quantity=inputs.quantity or 50,
                unit_price=inputs.unit_price or 45.0
            )
            from app.services.business_ops import business_ops_service
            business_ops_service.trigger_workflow(f"Add Stock - {item_name} (+{inputs.quantity or 50} units)", triggered_by="Agent Autonomous System")
            return InventoryToolOutput(success=True, result=res)

        elif act in ("update", "edit", "change", "set"):
            sku = inputs.sku_or_id or inputs.name or "Abaya"
            res = inventory_service.update_item(
                sku_or_id=sku,
                quantity=inputs.quantity,
                unit_price=inputs.unit_price,
                status=inputs.status,
                name=inputs.name
            )
            return InventoryToolOutput(success=True, result=res)

        elif act in ("delete", "remove", "delete_item", "remove_item", "drop", "clear"):
            target = inputs.sku_or_id or inputs.name
            if target:
                res = inventory_service.delete_item(target)
                return InventoryToolOutput(success=True, result=res)
            return InventoryToolOutput(success=False, result={"error": "Item name or SKU is required for deletion."})

        else:
            # Fallback to list_stock query
            all_items = [i.model_dump() for i in inventory_service.get_all_items()]
            total_qty = sum(item["quantity"] for item in all_items)
            breakdown = ", ".join([f"{item['name']} ({item['quantity']} units)" for item in all_items])
            return InventoryToolOutput(
                success=True,
                result={
                    "total_stock_quantity": total_qty,
                    "items": all_items,
                    "summary": f"Total stock is {total_qty} units: {breakdown}.",
                }
            )
