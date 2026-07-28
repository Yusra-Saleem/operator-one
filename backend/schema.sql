-- Operation One — Enterprise Voice AI Business Operations Platform
-- Supabase PostgreSQL Database Schema & Seed Data

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. DEALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.deals (
    id VARCHAR(50) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    stage VARCHAR(50) NOT NULL DEFAULT 'Lead',
    probability INT NOT NULL DEFAULT 30,
    owner VARCHAR(255) NOT NULL DEFAULT 'Unassigned',
    last_contact VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for stage queries
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON public.deals(owner);

-- ============================================================================
-- 2. INVENTORY ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'In Stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for category and status
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory_items(status);

-- ============================================================================
-- 3. OPERATIONAL ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.operational_alerts (
    id VARCHAR(50) PRIMARY KEY,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    timestamp VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for severity & category
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.operational_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_category ON public.operational_alerts(category);

-- ============================================================================
-- 4. WORKFLOWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workflows (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Approval',
    triggered_by VARCHAR(255) NOT NULL,
    start_time VARCHAR(100) NOT NULL,
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for workflow status
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & MULTI-TENANT ISOLATION POLICIES
-- ============================================================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default';
ALTER TABLE public.operational_alerts ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default';
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default';

-- Enable Row-Level Security
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation RLS Policies
CREATE POLICY tenant_isolation_deals ON public.deals FOR ALL USING (
    tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id' OR current_user = 'authenticated'
);

CREATE POLICY tenant_isolation_inventory ON public.inventory_items FOR ALL USING (
    tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id' OR current_user = 'authenticated'
);

CREATE POLICY tenant_isolation_alerts ON public.operational_alerts FOR ALL USING (
    tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id' OR current_user = 'authenticated'
);

CREATE POLICY tenant_isolation_workflows ON public.workflows FOR ALL USING (
    tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id' OR current_user = 'authenticated'
);

