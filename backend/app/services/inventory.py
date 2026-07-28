from typing import List, Dict, Any
from app.models.business import InventoryItem
from app.models.db_models import InventoryItemModel
from app.core.database import SessionLocal
from app.core.logger import logger

INITIAL_INVENTORY = [
    InventoryItem(id="INV-001", name="Luxury Black Nidha Silk Abaya", sku="ABY-BLK-001", category="Abayas", quantity=45, reorder_level=10, unit_price=120.0, status="In Stock"),
    InventoryItem(id="INV-002", name="Premium Chiffon Hijab - Dusty Rose", sku="HJB-ROS-002", category="Hijabs & Scarfs", quantity=8, reorder_level=15, unit_price=25.0, status="Low Stock"),
    InventoryItem(id="INV-003", name="Velvet Touch Breathable Niqab", sku="NQB-BLK-003", category="Niqabs", quantity=0, reorder_level=10, unit_price=18.0, status="Out of Stock"),
    InventoryItem(id="INV-004", name="Embroidered Gold Lace Kaftan Abaya", sku="ABY-GLD-004", category="Abayas", quantity=32, reorder_level=10, unit_price=185.0, status="In Stock"),
    InventoryItem(id="INV-005", name="Soft Premium Cotton Hijab Cap", sku="CAP-WHT-005", category="Accessories", quantity=75, reorder_level=20, unit_price=12.0, status="In Stock"),
]


class InventoryService:
    """Enterprise Inventory & Supply Chain Service backed by SQLAlchemy & PostgreSQL."""

    def __init__(self):
        self._fallback_inventory: List[InventoryItem] = list(INITIAL_INVENTORY)

    def _seed_db(self, db) -> None:
        try:
            count = db.query(InventoryItemModel).count()
            if count == 0:
                for item in INITIAL_INVENTORY:
                    db_item = InventoryItemModel(
                        id=item.id,
                        name=item.name,
                        sku=item.sku,
                        category=item.category,
                        quantity=item.quantity,
                        reorder_level=item.reorder_level,
                        unit_price=item.unit_price,
                        status=item.status,
                    )
                    db.add(db_item)
                db.commit()
                logger.info("Seeded initial inventory items into database.")
        except Exception:
            logger.exception("Failed to seed initial inventory items.")

    def get_all_items(self) -> List[InventoryItem]:
        try:
            with SessionLocal() as db:
                self._seed_db(db)
                db_items = db.query(InventoryItemModel).all()
                return [
                    InventoryItem(
                        id=i.id,
                        name=i.name,
                        sku=i.sku,
                        category=i.category,
                        quantity=i.quantity,
                        reorder_level=i.reorder_level,
                        unit_price=float(i.unit_price),
                        status=i.status
                    )
                    for i in db_items
                ]
        except Exception as exc:
            logger.exception("Database query for inventory failed")
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database Connection Unavailable: Unable to load inventory stock from Supabase PostgreSQL. Please check database connectivity."
            ) from exc

    def get_inventory_health(self) -> Dict[str, Any]:
        items = self.get_all_items()
        low_stock = [i for i in items if i.status == "Low Stock"]
        out_of_stock = [i for i in items if i.status == "Out of Stock"]
        total_items = len(items)
        in_stock_items = total_items - len(low_stock) - len(out_of_stock)
        health_score = int((in_stock_items / total_items) * 100) if total_items > 0 else 100
        total_value = sum(i.quantity * i.unit_price for i in items)

        return {
            "health_score": health_score,
            "total_items_count": total_items,
            "low_stock_count": len(low_stock),
            "out_of_stock_count": len(out_of_stock),
            "total_inventory_valuation": total_value,
            "critical_items": [item.model_dump() for item in low_stock + out_of_stock]
        }

    def trigger_reorder(self, sku_or_id: str, quantity: int = 50) -> Dict[str, Any]:
        items = self.get_all_items()
        target_item = None
        for item in items:
            if item.id.lower() == sku_or_id.lower() or item.sku.lower() == sku_or_id.lower():
                target_item = item
                break

        if not target_item:
            return {"success": False, "message": f"Item {sku_or_id} not found."}

        target_item.quantity += quantity
        if target_item.quantity > target_item.reorder_level:
            target_item.status = "In Stock"
        elif target_item.quantity > 0:
            target_item.status = "Low Stock"

        try:
            with SessionLocal() as db:
                db_item = db.query(InventoryItemModel).filter(
                    (InventoryItemModel.id == target_item.id) | (InventoryItemModel.sku == target_item.sku)
                ).first()
                if db_item:
                    db_item.quantity = target_item.quantity
                    db_item.status = target_item.status
                    db.commit()
                    logger.info("Updated DB inventory quantity for SKU %s", target_item.sku)
        except Exception:
            logger.exception("Failed to update inventory in DB.")

        return {
            "success": True,
            "message": f"Successfully reordered {quantity} units for {target_item.name}.",
            "item": target_item
        }

    def add_item(self, name: str, sku: str | None = None, category: str = "Abayas", quantity: int = 50, unit_price: float = 45.0) -> Dict[str, Any]:
        items = self.get_all_items()
        existing_item = None
        for item in items:
            if (sku and item.sku.lower() == sku.lower()) or (item.name.lower().strip() == name.lower().strip()) or (name.lower().strip() in item.name.lower()):
                existing_item = item
                break

        if existing_item:
            # Item already exists: increment quantity instead of creating duplicate!
            existing_item.quantity += quantity
            if unit_price and unit_price > 0:
                existing_item.unit_price = unit_price
            existing_item.status = "In Stock" if existing_item.quantity > 10 else ("Low Stock" if existing_item.quantity > 0 else "Out of Stock")

            try:
                with SessionLocal() as db:
                    db_item = db.query(InventoryItemModel).filter(
                        (InventoryItemModel.id == existing_item.id) | (InventoryItemModel.sku == existing_item.sku)
                    ).first()
                    if db_item:
                        db_item.quantity = existing_item.quantity
                        db_item.unit_price = existing_item.unit_price
                        db_item.status = existing_item.status
                        db.commit()
                        logger.info("Incremented stock quantity for existing item %s to %d", existing_item.sku, existing_item.quantity)
            except Exception:
                logger.exception("Failed to update stock quantity for existing item in DB.")

            return {
                "success": True,
                "message": f"Added {quantity} units to existing stock '{existing_item.name}'. New total: {existing_item.quantity} units (SKU: {existing_item.sku}).",
                "item": existing_item
            }

        # Create brand new item if it doesn't exist
        import time
        import uuid
        item_id = f"INV-{int(time.time())}"
        item_sku = sku or f"SKU-{uuid.uuid4().hex[:6].upper()}"
        status = "In Stock" if quantity > 10 else ("Low Stock" if quantity > 0 else "Out of Stock")

        new_item = InventoryItem(
            id=item_id,
            name=name,
            sku=item_sku,
            category=category,
            quantity=quantity,
            reorder_level=10,
            unit_price=unit_price,
            status=status
        )

        try:
            with SessionLocal() as db:
                db_item = InventoryItemModel(
                    id=item_id,
                    name=name,
                    sku=item_sku,
                    category=category,
                    quantity=quantity,
                    reorder_level=10,
                    unit_price=unit_price,
                    status=status
                )
                db.add(db_item)
                db.commit()
                logger.info("Added new inventory item %s to DB", item_sku)
        except Exception:
            logger.exception("Failed to insert inventory item to DB, updating fallback.")

        self._fallback_inventory.insert(0, new_item)
        return {
            "success": True,
            "message": f"Successfully created new stock item '{name}' (SKU: {item_sku}, Quantity: {quantity}, Price: ${unit_price}).",
            "item": new_item
        }

    def update_item(self, sku_or_id: str, quantity: int | None = None, unit_price: float | None = None, status: str | None = None, name: str | None = None) -> Dict[str, Any]:
        items = self.get_all_items()
        target_item = None
        for item in items:
            if item.id.lower() == sku_or_id.lower() or item.sku.lower() == sku_or_id.lower() or sku_or_id.lower() in item.name.lower():
                target_item = item
                break

        if not target_item:
            # If item not found by exact SKU, create it automatically!
            return self.add_item(name=sku_or_id if not name else name, quantity=quantity or 50, unit_price=unit_price or 45.0)

        if quantity is not None:
            target_item.quantity = quantity
        if unit_price is not None:
            target_item.unit_price = unit_price
        if name:
            target_item.name = name
        if status:
            target_item.status = status
        else:
            target_item.status = "In Stock" if target_item.quantity > 10 else ("Low Stock" if target_item.quantity > 0 else "Out of Stock")

        try:
            with SessionLocal() as db:
                db_item = db.query(InventoryItemModel).filter(
                    (InventoryItemModel.id == target_item.id) | (InventoryItemModel.sku == target_item.sku)
                ).first()
                if db_item:
                    if quantity is not None: db_item.quantity = target_item.quantity
                    if unit_price is not None: db_item.unit_price = target_item.unit_price
                    if name: db_item.name = target_item.name
                    db_item.status = target_item.status
                    db.commit()
                    logger.info("Updated DB inventory item %s", target_item.sku)
        except Exception:
            logger.exception("Failed to update inventory item in DB.")

        return {
            "success": True,
            "message": f"Successfully updated stock for '{target_item.name}' (SKU: {target_item.sku}, Quantity: {target_item.quantity}, Status: {target_item.status}).",
            "item": target_item
        }

    def delete_item(self, sku_or_id: str) -> Dict[str, Any]:
        deleted_name = sku_or_id
        try:
            with SessionLocal() as db:
                db_items = db.query(InventoryItemModel).filter(
                    (InventoryItemModel.id.ilike(f"%{sku_or_id}%")) |
                    (InventoryItemModel.sku.ilike(f"%{sku_or_id}%")) |
                    (InventoryItemModel.name.ilike(f"%{sku_or_id}%"))
                ).all()
                for db_item in db_items:
                    deleted_name = db_item.name
                    db.delete(db_item)
                if db_items:
                    db.commit()
                    logger.info("Deleted %d inventory item(s) matching %s", len(db_items), sku_or_id)
        except Exception:
            logger.exception("Failed to delete inventory item from DB.")

        self._fallback_inventory = [
            i for i in self._fallback_inventory
            if sku_or_id.lower() not in i.id.lower() and
               sku_or_id.lower() not in i.sku.lower() and
               sku_or_id.lower() not in i.name.lower()
        ]
        return {"success": True, "message": f"Successfully deleted '{deleted_name}' from inventory stock."}


inventory_service = InventoryService()
