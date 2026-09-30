-- ==============================================================================
-- SUPABASE CMS MIGRATION: 005_mcp_connections_v2.sql
-- Description: Evolve public.mcp_connections to a generic MCP connection model
-- supporting multiple transports (http) and auth_types (bearer, oauth2)
-- with safe metadata JSONB, preserving 100% backward compatibility.
-- ==============================================================================

-- 1. ADD GENERIC MCP CONNECTION COLUMNS (Nullable or with safe defaults)
ALTER TABLE public.mcp_connections
    ADD COLUMN IF NOT EXISTS transport TEXT NOT NULL DEFAULT 'http',
    ADD COLUMN IF NOT EXISTS auth_type TEXT NOT NULL DEFAULT 'bearer',
    ADD COLUMN IF NOT EXISTS server_url TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. BACKFILL server_url FROM server_url_hint IF EMPTY
UPDATE public.mcp_connections
SET server_url = server_url_hint
WHERE server_url IS NULL AND server_url_hint IS NOT NULL;

-- 3. INDEX FOR AUTH TYPE AND PROVIDER
CREATE INDEX IF NOT EXISTS idx_mcp_conn_auth_type ON public.mcp_connections(auth_type);
CREATE INDEX IF NOT EXISTS idx_mcp_conn_provider ON public.mcp_connections(provider);
