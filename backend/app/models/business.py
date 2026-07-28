from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Deal(BaseModel):
    id: str
    client_name: str
    value: float
    stage: str  # Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
    probability: int
    owner: str
    last_contact: str

class InventoryItem(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    quantity: int
    reorder_level: int
    unit_price: float
    status: str  # In Stock, Low Stock, Out of Stock

class OperationalAlert(BaseModel):
    id: str
    severity: str  # high, medium, low
    title: str
    message: str
    timestamp: str
    category: str  # sales, inventory, workflow, system

class WorkflowItem(BaseModel):
    id: str
    name: str
    status: str  # Active, Completed, Pending Approval, Failed
    triggered_by: str
    start_time: str
    progress: int

class ExecutiveSummary(BaseModel):
    mrr: float
    arr: float
    active_deals_count: int
    total_pipeline_value: float
    inventory_health_score: int
    operational_health_score: int
    pending_approvals_count: int
    open_alerts_count: int
    recent_alerts: List[OperationalAlert]
