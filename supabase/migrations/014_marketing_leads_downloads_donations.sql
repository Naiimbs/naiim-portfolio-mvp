-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 014_marketing_leads_downloads_donations.sql
-- Description:
--   1. Create marketing_leads table for lead capture and consent management.
--   2. Create resource_downloads table for download events and UTM tracking.
--   3. Create donations table for Ba9chich and supporter payment events.
--   4. Set up Row Level Security (RLS) policies.
-- Backward-compatible, additive, idempotent.
-- ==============================================================================

-- 1. Marketing Leads Table
CREATE TABLE IF NOT EXISTS public.marketing_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT,
    company TEXT,
    marketing_consent BOOLEAN NOT NULL DEFAULT false,
    consent_at TIMESTAMPTZ,
    source TEXT DEFAULT 'resource_download',
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON public.marketing_leads(email);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON public.marketing_leads(created_at DESC);

-- 2. Resource Downloads Table
CREATE TABLE IF NOT EXISTS public.resource_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.marketing_leads(id) ON DELETE SET NULL,
    resource_id TEXT NOT NULL,
    resource_slug TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'resource',
    asset_name TEXT,
    source TEXT DEFAULT 'web',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_lead_id ON public.resource_downloads(lead_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_slug ON public.resource_downloads(resource_slug);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_time ON public.resource_downloads(downloaded_at DESC);

-- 3. Donations / Supporters Table (Ba9chich & Supporters)
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'ba9chich',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    asset TEXT NOT NULL DEFAULT 'DiamondsTND',
    donor_username TEXT,
    donor_fullname TEXT,
    message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_status TEXT NOT NULL DEFAULT 'pending_verification', -- 'verified', 'pending_verification', 'rejected'
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_donations_payment_provider UNIQUE (payment_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_donations_received_at ON public.donations(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_provider ON public.donations(provider);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_leads:
-- Public can INSERT leads (for free resource lead capture)
DROP POLICY IF EXISTS "Public can insert leads" ON public.marketing_leads;
CREATE POLICY "Public can insert leads"
    ON public.marketing_leads FOR INSERT
    WITH CHECK (true);

-- Authenticated Admin can view and manage all leads
DROP POLICY IF EXISTS "Admin full access to leads" ON public.marketing_leads;
CREATE POLICY "Admin full access to leads"
    ON public.marketing_leads FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for resource_downloads:
-- Public can INSERT download events
DROP POLICY IF EXISTS "Public can record downloads" ON public.resource_downloads;
CREATE POLICY "Public can record downloads"
    ON public.resource_downloads FOR INSERT
    WITH CHECK (true);

-- Authenticated Admin can view and manage download events
DROP POLICY IF EXISTS "Admin full access to downloads" ON public.resource_downloads;
CREATE POLICY "Admin full access to downloads"
    ON public.resource_downloads FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for donations:
-- Authenticated Admin can view and manage donations
DROP POLICY IF EXISTS "Admin full access to donations" ON public.donations;
CREATE POLICY "Admin full access to donations"
    ON public.donations FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Service role has full access to donations (for webhooks)
DROP POLICY IF EXISTS "Service role full access to donations" ON public.donations;
CREATE POLICY "Service role full access to donations"
    ON public.donations FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
