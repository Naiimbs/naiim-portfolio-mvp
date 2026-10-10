-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 016_secure_resource_ingestion.sql
-- Description:
--   1. Create resource_ingest_rate_limits table for Edge Function abuse protection.
--   2. Create check_rate_limit() RPC.
--   3. Revoke direct anon INSERT grants on marketing_leads and resource_downloads.
--   4. Drop obsolete anon INSERT policies.
-- ==============================================================================

-- 1. Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.resource_ingest_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash TEXT NOT NULL,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(key_hash, window_started_at)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.resource_ingest_rate_limits(key_hash, window_started_at DESC);

-- Enable RLS to prevent public access
ALTER TABLE public.resource_ingest_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies needed. Service role will access this.


-- 2. Rate Limit Function (Atomic check + increment)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_limit INT,
    p_window_minutes INT
) RETURNS BOOLEAN AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_count INT;
BEGIN
    -- Determine the current window start time
    -- Example: bucket by exact window size from epoch, or just rolling window.
    -- For simplicity, we use a fixed tumbling window based on epoch.
    v_window_start := to_timestamp(floor(extract(epoch from now()) / (p_window_minutes * 60)) * (p_window_minutes * 60));

    -- Upsert the counter
    INSERT INTO public.resource_ingest_rate_limits (key_hash, window_started_at, request_count)
    VALUES (p_key, v_window_start, 1)
    ON CONFLICT (key_hash, window_started_at)
    DO UPDATE SET 
        request_count = resource_ingest_rate_limits.request_count + 1,
        updated_at = NOW()
    RETURNING request_count INTO v_count;

    -- Return true if within limit
    RETURN v_count <= p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- 3. Revoke direct anon INSERT grants
REVOKE INSERT ON public.marketing_leads FROM anon;
REVOKE INSERT ON public.resource_downloads FROM anon;


-- 4. Drop obsolete anon INSERT policies
DROP POLICY IF EXISTS "Public can insert leads" ON public.marketing_leads;
DROP POLICY IF EXISTS "Public can record downloads" ON public.resource_downloads;


-- 5. Restrict rate-limit RPC to trusted server-side calls
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT)
TO service_role;
