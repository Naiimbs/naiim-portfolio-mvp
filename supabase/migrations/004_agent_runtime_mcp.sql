-- ==============================================================================
-- SUPABASE CMS MIGRATION: 004_agent_runtime_mcp.sql
-- Description: Creates the public.mcp_connections and public.agent_runtime_configs
-- tables, establishing the CMS as the source of truth for AI Agent runtimes
-- and MCP integrations while strictly preventing secret/credential storage in the DB.
-- ==============================================================================

-- 1. MCP CONNECTIONS TABLE
-- Stores non-sensitive metadata for external MCP / n8n HTTP server configurations.
-- The server resolves connection_key (e.g. "n8n-main") to server-side process.env secrets.
CREATE TABLE IF NOT EXISTS public.mcp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL DEFAULT 'n8n', -- 'n8n', 'custom'
    connection_key TEXT UNIQUE NOT NULL,  -- maps to server secret resolver (e.g. "n8n-main")
    server_url_hint TEXT,                 -- safe non-secret endpoint hint (e.g. "https://n8n.example.com")
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AGENT RUNTIME CONFIGS TABLE
-- 1:1 relationship with public.agents defining execution behavior, allowed tools, and limits.
CREATE TABLE IF NOT EXISTS public.agent_runtime_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID UNIQUE NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    runtime_type TEXT NOT NULL DEFAULT 'none', -- 'none', 'mcp'
    mcp_connection_id UUID REFERENCES public.mcp_connections(id) ON DELETE SET NULL,
    default_tool TEXT,
    allowed_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeout_ms INTEGER NOT NULL DEFAULT 30000,
    max_input_length INTEGER NOT NULL DEFAULT 1000,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_mcp_conn_slug ON public.mcp_connections(slug);
CREATE INDEX IF NOT EXISTS idx_mcp_conn_key ON public.mcp_connections(connection_key);
CREATE INDEX IF NOT EXISTS idx_mcp_conn_active ON public.mcp_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_runtime_agent ON public.agent_runtime_configs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runtime_conn ON public.agent_runtime_configs(mcp_connection_id);
CREATE INDEX IF NOT EXISTS idx_agent_runtime_enabled ON public.agent_runtime_configs(is_enabled);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.mcp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runtime_configs ENABLE ROW LEVEL SECURITY;

-- 5. MCP CONNECTIONS POLICIES (Admin/Editor full access only)
CREATE POLICY "Admins have full access to mcp_connections"
    ON public.mcp_connections FOR ALL
    USING (public.is_admin());

-- 6. AGENT RUNTIME CONFIGS POLICIES
-- Public users can read basic runtime settings (e.g. is_enabled, default_tool) for published agents
CREATE POLICY "Public can read runtime configs of published agents"
    ON public.agent_runtime_configs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.agents
            WHERE id = agent_runtime_configs.agent_id AND status = 'published'
        )
    );

CREATE POLICY "Admins have full access to agent_runtime_configs"
    ON public.agent_runtime_configs FOR ALL
    USING (public.is_admin());
