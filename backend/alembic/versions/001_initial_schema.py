"""Initial Operation One Schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-23 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'deals',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('client_name', sa.String(length=255), nullable=False),
        sa.Column('value', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('stage', sa.String(length=50), nullable=False),
        sa.Column('probability', sa.Integer(), nullable=False),
        sa.Column('owner', sa.String(length=255), nullable=False),
        sa.Column('last_contact', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'inventory_items',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('reorder_level', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sku')
    )

    op.create_table(
        'operational_alerts',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('timestamp', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'workflows',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('triggered_by', sa.String(length=255), nullable=False),
        sa.Column('start_time', sa.String(length=100), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('workflows')
    op.drop_table('operational_alerts')
    op.drop_table('inventory_items')
    op.drop_table('deals')
