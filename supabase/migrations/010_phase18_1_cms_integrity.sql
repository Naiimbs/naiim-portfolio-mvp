-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 010_phase18_1_cms_integrity.sql
-- Description:
--   1. Correct check constraint "chk_registry_content_type" on content_registry to allow 'page'.
--   2. Safely register About page in content_registry with idempotent ON CONFLICT upsert.
--   3. Ensure comprehensive Header & Footer navigation items (including Career & Lab) without duplicates.
-- Backward-compatible, additive, idempotent.
-- ==============================================================================

-- 1. Correct check constraint on content_registry to include 'page'
ALTER TABLE public.content_registry DROP CONSTRAINT IF EXISTS chk_registry_content_type;
ALTER TABLE public.content_registry ADD CONSTRAINT chk_registry_content_type CHECK (
    content_type IN ('case-study', 'agent', 'plugin', 'blog', 'page', 'other')
);

-- 2. Ensure About Page exists in content_registry
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
    visibility = 'public',
    updated_at = NOW();

-- 3. Ensure draft Blog page exists in pages and content_registry (Page Builder architecture, non-public draft)
INSERT INTO public.pages (
    id,
    slug,
    title,
    status,
    template,
    seo_title,
    seo_description,
    canonical_url
)
VALUES (
    'c8479e3a-1294-4d87-8df0-721df904ea88',
    'blog',
    'Blog',
    'draft',
    'default',
    'Blog & Writing — Naïm Bsili',
    'Thoughts and notes on design systems, AI engineering, and product craft.',
    '/p/blog'
)
ON CONFLICT (slug) DO NOTHING;

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
    'c8479e3a-1294-4d87-8df0-721df904ea88',
    'Blog',
    'blog',
    'page',
    'draft',
    'private',
    '/p/blog',
    80,
    jsonb_build_object(
        'pageId', 'c8479e3a-1294-4d87-8df0-721df904ea88',
        'seo_title', 'Blog & Writing — Naïm Bsili',
        'description', 'Thoughts and notes on design systems, AI engineering, and product craft.',
        'template', 'default'
    )
)
ON CONFLICT (slug) DO UPDATE SET
    content_type = 'page',
    public_route = '/p/blog',
    status = 'draft',
    visibility = 'private',
    updated_at = NOW();

-- 4. Ensure Header Navigation Items exist (including Career and Lab)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'header' AND href = '/work') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'header', 'Work', '/work', 'link', 10, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'header' AND href = '/agents') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'header', 'Agents', '/agents', 'link', 20, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'header' AND href = '/copilot') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'header', 'Copilot', '/copilot', 'link', 30, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'header' AND href IN ('#career', '/#career')) THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'header', 'Career', '#career', 'link', 40, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'header' AND href IN ('#lab', '/#lab')) THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'header', 'Lab', '#lab', 'link', 50, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'header' AND href = '/about') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'header', 'About', '/about', 'link', 60, true, false);
    END IF;
END $$;

-- 5. Ensure Footer Navigation Items exist (including Career and Lab)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'footer' AND href = '/work' AND label = 'Work') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'footer', 'Work', '/work', 'link', 10, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'footer' AND label = 'Case Studies') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'footer', 'Case Studies', '/work', 'link', 20, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'footer' AND href = '/agents') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'footer', 'Agents', '/agents', 'link', 30, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'footer' AND href = '/copilot') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'footer', 'Copilot', '/copilot', 'link', 40, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'footer' AND href IN ('#career', '/#career')) THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'footer', 'Career', '#career', 'link', 50, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'footer' AND href IN ('#lab', '/#lab')) THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'footer', 'Lab', '#lab', 'link', 60, true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE location = 'footer' AND href = '/about') THEN
        INSERT INTO public.navigation_items (id, location, label, href, item_type, sort_order, is_visible, open_in_new_tab)
        VALUES (uuid_generate_v4(), 'footer', 'About', '/about', 'link', 70, true, false);
    END IF;
END $$;
