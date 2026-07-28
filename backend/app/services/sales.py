from typing import List, Dict, Any
from app.models.business import Deal
from app.models.db_models import DealModel
from app.core.database import SessionLocal
from app.core.logger import logger

INITIAL_DEALS = [
    Deal(id="DEAL-101", client_name="Al-Noor Modest Wear Boutique Dubai", value=45000.0, stage="Negotiation", probability=80, owner="Executive AI", last_contact="Yesterday"),
    Deal(id="DEAL-102", client_name="Riyadh Wholesale Hijab Center", value=85000.0, stage="Proposal Sent", probability=60, owner="Sales Team", last_contact="2 days ago"),
    Deal(id="DEAL-103", client_name="Karachi E-Commerce Direct Order Batch", value=18500.0, stage="Closed Won", probability=100, owner="Executive AI", last_contact="3 hours ago"),
    Deal(id="DEAL-104", client_name="Istanbul Kaftan Trade Lead", value=32000.0, stage="Qualified", probability=40, owner="Sales Team", last_contact="Just now"),
]


class SalesService:
    """Enterprise Sales Operations Service backed by SQLAlchemy & PostgreSQL."""

    def __init__(self):
        self._fallback_deals: List[Deal] = list(INITIAL_DEALS)

    def _seed_db(self, db) -> None:
        try:
            count = db.query(DealModel).count()
            if count == 0:
                for deal in INITIAL_DEALS:
                    db_model = DealModel(
                        id=deal.id,
                        client_name=deal.client_name,
                        value=deal.value,
                        stage=deal.stage,
                        probability=deal.probability,
                        owner=deal.owner,
                        last_contact=deal.last_contact,
                    )
                    db.add(db_model)
                db.commit()
                logger.info("Seeded initial sales deals into database.")
        except Exception:
            logger.exception("Failed to seed initial sales deals.")

    def get_all_deals(self) -> List[Deal]:
        try:
            with SessionLocal() as db:
                self._seed_db(db)
                db_deals = db.query(DealModel).all()
                return [
                    Deal(
                        id=d.id,
                        client_name=d.client_name,
                        value=float(d.value),
                        stage=d.stage,
                        probability=d.probability,
                        owner=d.owner,
                        last_contact=d.last_contact or "N/A"
                    )
                    for d in db_deals
                ]
        except Exception as exc:
            logger.exception("Database query for deals failed")
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database Connection Unavailable: Unable to load sales pipeline deals from Supabase PostgreSQL. Please check database connectivity."
            ) from exc

    def get_pipeline_summary(self) -> Dict[str, Any]:
        deals = self.get_all_deals()
        total_val = sum(d.value for d in deals)
        weighted_val = sum(d.value * (d.probability / 100.0) for d in deals)
        won_val = sum(d.value for d in deals if d.stage == "Closed Won")
        stage_counts = {}
        for d in deals:
            stage_counts[d.stage] = stage_counts.get(d.stage, 0) + 1

        return {
            "total_pipeline_value": total_val,
            "weighted_pipeline_value": weighted_val,
            "closed_won_value": won_val,
            "active_deals": len([d for d in deals if d.stage not in ("Closed Won", "Closed Lost")]),
            "deals_by_stage": stage_counts
        }

    def add_deal(self, client_name: str, value: float, stage: str = "Lead", owner: str = "Executive AI") -> Deal:
        deals = self.get_all_deals()
        deal_id = f"DEAL-{101 + len(deals)}"
        new_deal = Deal(
            id=deal_id,
            client_name=client_name,
            value=value,
            stage=stage,
            probability=30 if stage == "Lead" else 75,
            owner=owner,
            last_contact="Just now"
        )
        try:
            with SessionLocal() as db:
                db_model = DealModel(
                    id=new_deal.id,
                    client_name=new_deal.client_name,
                    value=new_deal.value,
                    stage=new_deal.stage,
                    probability=new_deal.probability,
                    owner=new_deal.owner,
                    last_contact=new_deal.last_contact
                )
                db.add(db_model)
                db.commit()
                logger.info("Added deal %s to DB", deal_id)
        except Exception:
            logger.exception("Failed to insert deal into DB, updating fallback.")
            self._fallback_deals.insert(0, new_deal)

        return new_deal

    def update_deal(self, deal_id_or_client: str, value: float | None = None, stage: str | None = None, probability: int | None = None, owner: str | None = None) -> Dict[str, Any]:
        deals = self.get_all_deals()
        target_deal = None
        for d in deals:
            if d.id.lower() == deal_id_or_client.lower() or deal_id_or_client.lower() in d.client_name.lower():
                target_deal = d
                break

        if not target_deal:
            new_d = self.add_deal(client_name=deal_id_or_client, value=value or 10000.0, stage=stage or "Qualified")
            return {"success": True, "message": f"Created new deal for {deal_id_or_client}", "deal": new_d.model_dump()}

        if value is not None: target_deal.value = value
        if stage: target_deal.stage = stage
        if probability is not None: target_deal.probability = probability
        if owner: target_deal.owner = owner
        target_deal.last_contact = "Just now"

        try:
            with SessionLocal() as db:
                db_model = db.query(DealModel).filter(
                    (DealModel.id == target_deal.id) | (DealModel.client_name == target_deal.client_name)
                ).first()
                if db_model:
                    if value is not None: db_model.value = target_deal.value
                    if stage: db_model.stage = target_deal.stage
                    if probability is not None: db_model.probability = target_deal.probability
                    if owner: db_model.owner = target_deal.owner
                    db_model.last_contact = "Just now"
                    db.commit()
                    logger.info("Updated deal %s in DB", target_deal.id)
        except Exception:
            logger.exception("Failed to update deal in DB")

        return {"success": True, "message": f"Updated deal for {target_deal.client_name}", "deal": target_deal.dict()}

    def delete_deal(self, deal_id_or_client: str) -> Dict[str, Any]:
        deleted_client = deal_id_or_client
        try:
            with SessionLocal() as db:
                db_deals = db.query(DealModel).filter(
                    (DealModel.id.ilike(f"%{deal_id_or_client}%")) |
                    (DealModel.client_name.ilike(f"%{deal_id_or_client}%"))
                ).all()
                for db_deal in db_deals:
                    deleted_client = db_deal.client_name
                    db.delete(db_deal)
                if db_deals:
                    db.commit()
                    logger.info("Deleted %d sales deal(s) matching %s", len(db_deals), deal_id_or_client)
        except Exception:
            logger.exception("Failed to delete deal from DB.")

        self._fallback_deals = [
            d for d in self._fallback_deals
            if deal_id_or_client.lower() not in d.id.lower() and
               deal_id_or_client.lower() not in d.client_name.lower()
        ]
        return {"success": True, "message": f"Successfully deleted deal for '{deleted_client}'."}


sales_service = SalesService()
