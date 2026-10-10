-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 012_phase19_2_navigation_blog.sql
-- Description:
--   1. Ensure Blog is registered as a canonical header and footer navigation item.
--   2. Authoritative source of truth: public.navigation_items.
--   3. Idempotent, additive, non-destructive.
-- ==============================================================================

DO $$
BEGIN
    -- 1. Header Blog item (sort_order 25: between Agents at 20 and Copilot at 30)
    IF NOT EXISTS (
        SELECT 1 FROM public.navigation_items
        WHERE location = 'header' AND (href = '/blog' OR label = 'Blog')
    ) THEN
        INSERT INTO public.navigation_items (
            id,
            location,
            label,
            href,
            item_type,
            sort_order,
            is_visible,
            open_in_new_tab,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'header',
            'Blog',
            '/blog',
            'link',
            25,
            true,
            false,
            NOW(),
            NOW()
        );
    END IF;

    -- 2. Footer Blog item
    IF NOT EXISTS (
        SELECT 1 FROM public.navigation_items
        WHERE location = 'footer' AND (href = '/blog' OR label = 'Blog')
    ) THEN
        INSERT INTO public.navigation_items (
            id,
            location,
            label,
            href,
            item_type,
            sort_order,
            is_visible,
            open_in_new_tab,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'footer',
            'Blog',
            '/blog',
            'link',
            25,
            true,
            false,
            NOW(),
            NOW()
        );
    END IF;
END $$;
