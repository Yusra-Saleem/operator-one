"""SQLAlchemy ORM database models for Supabase PostgreSQL."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class DealModel(Base):
    __tablename__ = "deals"

    id = Column(String(50), primary_key=True)
    client_name = Column(String(255), nullable=False)
    value = Column(Numeric(15, 2), nullable=False, default=0.00)
    stage = Column(String(50), nullable=False, default="Lead")
    probability = Column(Integer, nullable=False, default=30)
    owner = Column(String(255), nullable=False, default="Unassigned")
    last_contact = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InventoryItemModel(Base):
    __tablename__ = "inventory_items"

    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=10)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0.00)
    status = Column(String(50), nullable=False, default="In Stock")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OperationalAlertModel(Base):
    __tablename__ = "operational_alerts"

    id = Column(String(50), primary_key=True)
    severity = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    timestamp = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WorkflowModel(Base):
    __tablename__ = "workflows"

    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="Pending Approval")
    triggered_by = Column(String(255), nullable=False)
    start_time = Column(String(100), nullable=False)
    progress = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
