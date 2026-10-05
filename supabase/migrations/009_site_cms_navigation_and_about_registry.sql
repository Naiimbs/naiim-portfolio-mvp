-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 009_site_cms_navigation_and_about_registry.sql
-- Description: Seed default navigation items (Header & Footer) and ensure About page is registered in Content Registry.
-- Backward-compatible, additive, idempotent.
-- ==============================================================================

-- 1. Ensure About Page exists in content_registry
INSERT INTO public.content_registry (
    id,
    title,
    slug,
    content_type,
    status,
    visibility,
    public_route,
    sort_order,
    metadata
)
VALUES (
    'b458c42a-8e8e-4629-b6cd-9eae47ccbb79',
    'About',
    'about',
    'page',
    'published',
    'public',
    '/about',
    10,
    jsonb_build_object(
        'pageId', 'b458c42a-8e8e-4629-b6cd-9eae47ccbb79',
        'seo_title', 'About — Naïm Bsili | Product Designer & AI Builder',
        'description', 'Career journey, product design philosophy, and AI automation expertise of Naïm Bsili.',
        'template', 'default',
        'tags', jsonb_build_array('About', 'Profile', 'Philosophy')
    )
)
ON CONFLICT (slug) DO UPDATE SET
    content_type = 'page',
    public_route = '/about',
    status = 'published',
    visibility = 'public';

-- 2. Seed default Header Navigation Items if table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'header') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES
            (uuid_generate_v4(), 'header', 'Work', '/work', 'link', 10, true, false),
            (uuid_generate_v4(), 'header', 'Agents', '/agents', 'link', 20, true, false),
            (uuid_generate_v4(), 'header', 'Copilot', '/copilot', 'link', 30, true, false),
            (uuid_generate_v4(), 'header', 'About', '/about', 'link', 40, true, false);
    END IF;
END $$;

-- 3. Seed default Footer Navigation Items if table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'footer') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES
            (uuid_generate_v4(), 'footer', 'Work', '/work', 'link', 10, true, false),
            (uuid_generate_v4(), 'footer', 'Case Studies', '/work', 'link', 20, true, false),
            (uuid_generate_v4(), 'footer', 'Agents', '/agents', 'link', 30, true, false),
            (uuid_generate_v4(), 'footer', 'Copilot', '/copilot', 'link', 40, true, false),
            (uuid_generate_v4(), 'footer', 'About', '/about', 'link', 50, true, false);
    END IF;
END $$;
