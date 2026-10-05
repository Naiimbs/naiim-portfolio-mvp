-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 007_cms_registry.sql
-- Description: Content Registry metadata table for Portfolio (Case Studies, Agents, Plugins, Blog).
-- ==============================================================================

-- 1. CONTENT REGISTRY TABLE
CREATE TABLE IF NOT EXISTS public.content_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    visibility TEXT NOT NULL DEFAULT 'public',
    featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    public_route TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_registry_content_type CHECK (
        content_type IN ('case-study', 'agent', 'plugin', 'blog', 'other')
    ),
    CONSTRAINT chk_registry_status CHECK (
        status IN ('draft', 'published', 'archived')
    ),
    CONSTRAINT chk_registry_visibility CHECK (
        visibility IN ('public', 'private')
    )
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_content_registry_slug ON public.content_registry(slug);
CREATE INDEX IF NOT EXISTS idx_content_registry_type ON public.content_registry(content_type);
CREATE INDEX IF NOT EXISTS idx_content_registry_status ON public.content_registry(status);
CREATE INDEX IF NOT EXISTS idx_content_registry_visibility ON public.content_registry(visibility);
CREATE INDEX IF NOT EXISTS idx_content_registry_sort ON public.content_registry(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_content_registry_featured ON public.content_registry(featured);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.content_registry ENABLE ROW LEVEL SECURITY;

-- Anonymous and general public can ONLY read published and public registry entries
DROP POLICY IF EXISTS "Public can read published public registry entries" ON public.content_registry;
CREATE POLICY "Public can read published public registry entries"
    ON public.content_registry FOR SELECT
    USING (status = 'published' AND visibility = 'public');

-- Authorized admins have full CRUD access
DROP POLICY IF EXISTS "Admins have full access to content registry" ON public.content_registry;
CREATE POLICY "Admins have full access to content registry"
    ON public.content_registry FOR ALL
    USING (public.is_admin());

-- 4. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_registry_modtime ON public.content_registry;
CREATE TRIGGER update_content_registry_modtime
    BEFORE UPDATE ON public.content_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
