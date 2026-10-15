-- 022_fix_blog_route_sync.sql
-- The Blog page is code-owned: the live /blog route is rendered by BlogPage
-- (React) and lists published blog posts. Earlier seeds pointed its page +
-- registry records at /p/blog, which made the Site Pages module show it as
-- "Desynced" and link to the wrong (non-existent) route.
--
-- Align both records with the real live route (/blog). This is purely a
-- metadata fix — no content changes.

UPDATE public.pages
SET canonical_url = '/blog',
    updated_at = NOW()
WHERE slug = 'blog';

UPDATE public.content_registry
SET public_route = '/blog',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('public_route', '/blog'),
    updated_at = NOW()
WHERE slug = 'blog' AND content_type = 'page';
