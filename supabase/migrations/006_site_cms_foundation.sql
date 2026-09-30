-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 006_site_cms_foundation.sql
-- Description: Site-wide CMS foundation schema (Pages, Page Sections, Navigation Items, Site Settings) with RLS.
-- ==============================================================================

-- 1. PAGES TABLE
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status content_status NOT NULL DEFAULT 'draft',
    template TEXT DEFAULT 'default',
    seo_title TEXT,
    seo_description TEXT,
    canonical_url TEXT,
    og_image_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);

-- 2. PAGE SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.page_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    label TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page_id ON public.page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_page_sort ON public.page_sections(page_id, sort_order);

-- 3. NAVIGATION ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location TEXT NOT NULL DEFAULT 'header',
    label TEXT NOT NULL,
    href TEXT,
    item_type TEXT DEFAULT 'link',
    parent_id UUID REFERENCES public.navigation_items(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    open_in_new_tab BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_navigation_location ON public.navigation_items(location);
CREATE INDEX IF NOT EXISTS idx_navigation_parent_id ON public.navigation_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_navigation_location_sort ON public.navigation_items(location, sort_order);

-- 4. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_public ON public.site_settings(is_public);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Pages RLS
CREATE POLICY "Public can read published pages"
    ON public.pages FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admins have full access to pages"
    ON public.pages FOR ALL
    USING (public.is_admin());

-- Page Sections RLS
CREATE POLICY "Public can read visible page sections"
    ON public.page_sections FOR SELECT
    USING (
        is_visible = true AND
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE id = page_sections.page_id AND status = 'published'
        )
    );

CREATE POLICY "Admins have full access to page sections"
    ON public.page_sections FOR ALL
    USING (public.is_admin());

-- Navigation Items RLS
CREATE POLICY "Public can read visible navigation items"
    ON public.navigation_items FOR SELECT
    USING (is_visible = true);

CREATE POLICY "Admins have full access to navigation items"
    ON public.navigation_items FOR ALL
    USING (public.is_admin());

-- Site Settings RLS (Secured: public SELECT requires is_public = true)
CREATE POLICY "Public can read public site settings"
    ON public.site_settings FOR SELECT
    USING (is_public = true);

CREATE POLICY "Admins have full access to site settings"
    ON public.site_settings FOR ALL
    USING (public.is_admin());

-- 6. UPDATED_AT TRIGGER FUNCTION & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_pages_modtime
    BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_page_sections_modtime
    BEFORE UPDATE ON public.page_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_navigation_items_modtime
    BEFORE UPDATE ON public.navigation_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_site_settings_modtime
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
