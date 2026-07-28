from typing import List, Dict, Any
from app.models.business import ExecutiveSummary, OperationalAlert, WorkflowItem
from app.models.db_models import OperationalAlertModel, WorkflowModel
from app.core.database import SessionLocal
from app.core.logger import logger
from app.services.sales import sales_service
from app.services.inventory import inventory_service

INITIAL_ALERTS = []
INITIAL_WORKFLOWS = []


class BusinessOpsService:
    """Enterprise Business Operations & Executive Aggregator Service with PostgreSQL persistence."""

    def __init__(self):
        self._fallback_alerts: List[OperationalAlert] = []
        self._fallback_workflows: List[WorkflowItem] = []
        self._activities: List[Dict[str, Any]] = [
            {"time": "Just now", "agent": "CoordinatorAgent", "action": "Synchronized live Abaya & Modest Wear stock telemetries", "status": "Completed"},
            {"time": "15 mins ago", "agent": "InventoryAgent", "action": "Checked stock for Saudi 3-Layer Niqabs and Cotton Hijab Caps", "status": "Completed"},
            {"time": "1 hour ago", "agent": "SalesAgent", "action": "Logged Fatima Ahmed Black Dubai Nidha Abaya sale ($22.00)", "status": "Completed"},
            {"time": "2 hours ago", "agent": "ExecutiveAgent", "action": "Evaluated Abaya store operational health and sales pipeline", "status": "Completed"}
        ]

    def log_agent_activity(self, agent_name: str, action: str, status: str = "Completed") -> None:
        self._activities.insert(0, {
            "time": "Just now",
            "agent": agent_name,
            "action": action,
            "status": status,
        })
        self._activities = self._activities[:20]

    def get_agent_activities(self) -> List[Dict[str, Any]]:
        return self._activities

    def _seed_db(self, db) -> None:
        pass

    def get_alerts(self) -> List[OperationalAlert]:
        try:
            with SessionLocal() as db:
                self._seed_db(db)
                db_alerts = db.query(OperationalAlertModel).all()
                return [
                    OperationalAlert(
                        id=a.id,
                        severity=a.severity,
                        title=a.title,
                        message=a.message,
                        timestamp=a.timestamp,
                        category=a.category
                    )
                    for a in db_alerts
                ]
        except Exception as exc:
            logger.exception("DB query for alerts failed")
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database Connection Unavailable: Unable to load operational alerts from Supabase PostgreSQL. Please check database connectivity."
            ) from exc

    def get_workflows(self) -> List[WorkflowItem]:
        try:
            with SessionLocal() as db:
                self._seed_db(db)
                db_wfs = db.query(WorkflowModel).all()
                return [
                    WorkflowItem(
                        id=w.id,
                        name=w.name,
                        status=w.status,
                        triggered_by=w.triggered_by,
                        start_time=w.start_time,
                        progress=w.progress
                    )
                    for w in db_wfs
                ]
        except Exception as exc:
            logger.exception("DB query for workflows failed")
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database Connection Unavailable: Unable to load workflow automation logs from Supabase PostgreSQL. Please check database connectivity."
            ) from exc

    def get_executive_summary(self) -> ExecutiveSummary:
        pipeline = sales_service.get_pipeline_summary()
        inv_health = inventory_service.get_inventory_health()
        alerts = self.get_alerts()
        workflows = self.get_workflows()

        mrr = float(pipeline.get("closed_won_value", 0.0))
        arr = mrr * 12

        high_alerts = len([a for a in alerts if a.severity == "high"])
        op_score = max(0, 100 - (high_alerts * 15))

        return ExecutiveSummary(
            mrr=mrr,
            arr=arr,
            active_deals_count=pipeline["active_deals"],
            total_pipeline_value=pipeline["total_pipeline_value"],
            inventory_health_score=inv_health["health_score"],
            operational_health_score=op_score,
            pending_approvals_count=len([w for w in workflows if w.status == "Pending Approval"]),
            open_alerts_count=len(alerts),
            recent_alerts=alerts
        )

    def trigger_workflow(self, workflow_name: str, triggered_by: str = "Voice Command") -> WorkflowItem:
        workflows = self.get_workflows()
        wf_id = f"WF-{101 + len(workflows)}"
        wf = WorkflowItem(
            id=wf_id,
            name=workflow_name,
            status="Active",
            triggered_by=triggered_by,
            start_time="Just now",
            progress=10
        )
        try:
            with SessionLocal() as db:
                db_wf = WorkflowModel(
                    id=wf.id,
                    name=wf.name,
                    status=wf.status,
                    triggered_by=wf.triggered_by,
                    start_time=wf.start_time,
                    progress=wf.progress
                )
                db.add(db_wf)
                db.commit()
                logger.info("Inserted new workflow %s into DB", wf_id)
        except Exception:
            logger.exception("Failed to insert workflow into DB.")
            self._fallback_workflows.insert(0, wf)

        return wf


business_ops_service = BusinessOpsService()
