-- ==============================================================================
-- SUPABASE CMS MIGRATION: 003_agents_cms.sql
-- Description: Creates the public.agents and public.agent_case_studies tables
-- along with performance indexes, foreign keys, and RLS policies for Phase 14.
-- ==============================================================================

-- 1. DEMO TYPE ENUM
DO $$ BEGIN
    CREATE TYPE agent_demo_type AS ENUM ('none', 'external', 'embedded', 'internal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'AI Agent',
    status content_status NOT NULL DEFAULT 'draft',
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    role TEXT,
    tools TEXT[] DEFAULT '{}',
    workflow_platform TEXT DEFAULT 'n8n',
    thumbnail_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
    hero_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
    demo_type agent_demo_type NOT NULL DEFAULT 'none',
    demo_url TEXT,
    github_url TEXT,
    n8n_workflow_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AGENT CASE STUDIES TABLE
CREATE TABLE IF NOT EXISTS public.agent_case_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID UNIQUE NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    subtitle TEXT,
    hero_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    status content_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AGENT CASE STUDY SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.agent_case_study_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_case_study_id UUID NOT NULL REFERENCES public.agent_case_studies(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    title TEXT,
    eyebrow TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AGENT SECTION BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.agent_section_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.agent_case_study_sections(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_agents_slug ON public.agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_featured ON public.agents(is_featured);
CREATE INDEX IF NOT EXISTS idx_agents_order ON public.agents(sort_order);
CREATE INDEX IF NOT EXISTS idx_agent_cs_agent ON public.agent_case_studies(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_cs_status ON public.agent_case_studies(status);
CREATE INDEX IF NOT EXISTS idx_agent_sections_cs ON public.agent_case_study_sections(agent_case_study_id, order_index);
CREATE INDEX IF NOT EXISTS idx_agent_blocks_sec ON public.agent_section_blocks(section_id, order_index);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_case_study_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_section_blocks ENABLE ROW LEVEL SECURITY;

-- 8. AGENTS POLICIES
CREATE POLICY "Public can read published agents"
    ON public.agents FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admins have full access to agents"
    ON public.agents FOR ALL
    USING (public.is_admin());

-- 9. AGENT CASE STUDIES POLICIES
CREATE POLICY "Public can read published agent case studies"
    ON public.agent_case_studies FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admins have full access to agent case studies"
    ON public.agent_case_studies FOR ALL
    USING (public.is_admin());

-- 10. AGENT CASE STUDY SECTIONS POLICIES
CREATE POLICY "Public can read visible sections of published agent case studies"
    ON public.agent_case_study_sections FOR SELECT
    USING (
        is_visible = true AND
        EXISTS (
            SELECT 1 FROM public.agent_case_studies
            WHERE id = agent_case_study_sections.agent_case_study_id AND status = 'published'
        )
    );

CREATE POLICY "Admins have full access to agent case study sections"
    ON public.agent_case_study_sections FOR ALL
    USING (public.is_admin());

-- 11. AGENT SECTION BLOCKS POLICIES
CREATE POLICY "Public can read visible blocks of published agent case studies"
    ON public.agent_section_blocks FOR SELECT
    USING (
        is_visible = true AND
        EXISTS (
            SELECT 1 FROM public.agent_case_study_sections s
            JOIN public.agent_case_studies acs ON acs.id = s.agent_case_study_id
            WHERE s.id = agent_section_blocks.section_id AND s.is_visible = true AND acs.status = 'published'
        )
    );

CREATE POLICY "Admins have full access to agent section blocks"
    ON public.agent_section_blocks FOR ALL
    USING (public.is_admin());
