-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 011_phase19_content_operations.sql
-- Description:
--   1. Extend content_status enum and check constraints to support editorial lifecycle:
--      draft -> in_review -> ready -> published -> archived.
--   2. Ensure Blog content type has authoritative schema and initial seed in content_registry.
--   3. Backward-compatible, additive, idempotent.
-- ==============================================================================

-- 1. Extend content_status enum if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        BEGIN
            ALTER TYPE content_status ADD VALUE IF NOT EXISTS 'in_review';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER TYPE content_status ADD VALUE IF NOT EXISTS 'ready';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- 2. Update check constraint on content_registry status
ALTER TABLE public.content_registry DROP CONSTRAINT IF EXISTS chk_registry_status;
ALTER TABLE public.content_registry ADD CONSTRAINT chk_registry_status CHECK (
    status IN ('draft', 'in_review', 'ready', 'published', 'archived')
);

-- 3. Ensure content_registry content_type check constraint includes blog and page
ALTER TABLE public.content_registry DROP CONSTRAINT IF EXISTS chk_registry_content_type;
ALTER TABLE public.content_registry ADD CONSTRAINT chk_registry_content_type CHECK (
    content_type IN ('case-study', 'agent', 'plugin', 'blog', 'page', 'other')
);

-- 4. Seed Canonical Blog Post in Content Registry (Published & Public)
INSERT INTO public.content_registry (
    id,
    title,
    slug,
    content_type,
    status,
    visibility,
    featured,
    public_route,
    sort_order,
    metadata
)
VALUES (
    'c1900001-0000-4000-a000-000000000001',
    'How I Built My AI Copilot: Architecture & Design Decisions',
    'how-i-built-my-ai-copilot',
    'blog',
    'published',
    'public',
    true,
    '/blog/how-i-built-my-ai-copilot',
    10,
    jsonb_build_object(
        'excerpt', 'A deep dive into building an autonomous portfolio copilot using React, custom MCP tools, and semantic embeddings.',
        'author', 'Naïm Bsili',
        'category', 'AI & Architecture',
        'tags', jsonb_build_array('AI Copilot', 'MCP', 'Product Design', 'Architecture'),
        'featuredImage', 'cover-copilot-naim-DXZL9efD.png',
        'readingTime', '5 min read',
        'wordCount', 1250,
        'publishedAt', '2026-09-15T10:00:00Z',
        'seo', jsonb_build_object(
            'title', 'How I Built My AI Copilot — Naïm Bsili',
            'description', 'A deep dive into building an autonomous portfolio copilot with low latency and real-time tool orchestration.',
            'canonical', '/blog/how-i-built-my-ai-copilot'
        ),
        'social', jsonb_build_object(
            'ogTitle', 'How I Built My AI Copilot: Architecture & Design Decisions',
            'ogDescription', 'A deep dive into building an autonomous portfolio copilot using React and MCP tools.',
            'ogImage', 'cover-copilot-naim-DXZL9efD.png'
        ),
        'relationships', jsonb_build_array(
            jsonb_build_object(
                'id', 'winni-case-study',
                'type', 'case-study',
                'title', 'WINNI — Physical-to-Digital Identity',
                'slug', 'winni'
            )
        )
    )
)
ON CONFLICT (slug) DO UPDATE SET
    content_type = 'blog',
    public_route = '/blog/how-i-built-my-ai-copilot',
    status = 'published',
    visibility = 'public',
    featured = true,
    updated_at = NOW();

-- 5. Seed second draft Blog Post in Content Registry (In Review Editorial state)
INSERT INTO public.content_registry (
    id,
    title,
    slug,
    content_type,
    status,
    visibility,
    featured,
    public_route,
    sort_order,
    metadata
)
VALUES (
    'c1900002-0000-4000-a000-000000000002',
    'Design Systems in the Era of Generative UI',
    'design-systems-generative-ui',
    'blog',
    'in_review',
    'public',
    false,
    '/blog/design-systems-generative-ui',
    20,
    jsonb_build_object(
        'excerpt', 'Exploring how tokens and component contracts evolve when AI models generate runtime interfaces on the fly.',
        'author', 'Naïm Bsili',
        'category', 'Design Systems',
        'tags', jsonb_build_array('Design Systems', 'Generative UI', 'Figma', 'Tokens'),
        'featuredImage', 'The-work-behind-the-interface-BSelJoQv.png',
        'readingTime', '4 min read',
        'wordCount', 980,
        'seo', jsonb_build_object(
            'title', 'Design Systems in the Era of Generative UI — Naïm Bsili',
            'description', 'How tokens and component contracts evolve when AI models generate runtime interfaces.'
        )
    )
)
ON CONFLICT (slug) DO UPDATE SET
    content_type = 'blog',
    public_route = '/blog/design-systems-generative-ui',
    status = 'in_review',
    updated_at = NOW();
