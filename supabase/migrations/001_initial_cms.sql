-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 001_initial_cms.sql
-- Description: Core schema for Projects, Case Studies, Sections, Blocks, Media, Profiles & RLS.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES
DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_study_type AS ENUM ('standard', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users for safe role authorization)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. MEDIA TABLE (Metadata for assets stored in Supabase Storage 'portfolio-media')
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    alt_text TEXT DEFAULT '',
    caption TEXT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    kicker TEXT,
    short_description TEXT,
    category TEXT NOT NULL DEFAULT 'Product Design',
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    roles TEXT[] DEFAULT '{}',
    tools TEXT[] DEFAULT '{}',
    thumbnail_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CASE STUDIES TABLE
CREATE TABLE IF NOT EXISTS public.case_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type case_study_type NOT NULL DEFAULT 'standard',
    title TEXT NOT NULL,
    subtitle TEXT,
    hero_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    status content_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CASE STUDY SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.case_study_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    title TEXT,
    eyebrow TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SECTION BLOCKS TABLE (Flexible JSONB payload per block)
CREATE TABLE IF NOT EXISTS public.section_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.case_study_sections(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_order ON public.projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_case_studies_project ON public.case_studies(project_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON public.case_studies(status);
CREATE INDEX IF NOT EXISTS idx_sections_case_study ON public.case_study_sections(case_study_id, order_index);
CREATE INDEX IF NOT EXISTS idx_blocks_section ON public.section_blocks(section_id, order_index);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_blocks ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- MEDIA POLICIES
CREATE POLICY "Public can view media"
    ON public.media FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage media"
    ON public.media FOR ALL
    USING (public.is_admin());

-- PROJECTS POLICIES
CREATE POLICY "Public can read published projects"
    ON public.projects FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admins have full access to projects"
    ON public.projects FOR ALL
    USING (public.is_admin());

-- CASE STUDIES POLICIES
CREATE POLICY "Public can read published case studies"
    ON public.case_studies FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admins have full access to case studies"
    ON public.case_studies FOR ALL
    USING (public.is_admin());

-- CASE STUDY SECTIONS POLICIES
CREATE POLICY "Public can read visible sections of published case studies"
    ON public.case_study_sections FOR SELECT
    USING (
        is_visible = true AND
        EXISTS (
            SELECT 1 FROM public.case_studies
            WHERE id = case_study_sections.case_study_id AND status = 'published'
        )
    );

CREATE POLICY "Admins have full access to sections"
    ON public.case_study_sections FOR ALL
    USING (public.is_admin());

-- SECTION BLOCKS POLICIES
CREATE POLICY "Public can read visible blocks of published case studies"
    ON public.section_blocks FOR SELECT
    USING (
        is_visible = true AND
        EXISTS (
            SELECT 1 FROM public.case_study_sections s
            JOIN public.case_studies cs ON cs.id = s.case_study_id
            WHERE s.id = section_blocks.section_id AND s.is_visible = true AND cs.status = 'published'
        )
    );

CREATE POLICY "Admins have full access to blocks"
    ON public.section_blocks FOR ALL
    USING (public.is_admin());
