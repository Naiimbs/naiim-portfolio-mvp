-- 023_fix_page_registry_routes.sql
-- Normalize content_registry.public_route for CMS pages that live at dedicated
-- top-level routes. A stale resolver previously wrote "/p/home", "/p/work",
-- etc. into the registry on publish/sync, which made Site Pages report those
-- pages as "Desynced". Align them with the real routes declared in App.jsx.

UPDATE public.content_registry SET public_route = '/',       updated_at = NOW() WHERE content_type = 'page' AND slug IN ('home', 'index');
UPDATE public.content_registry SET public_route = '/about',  updated_at = NOW() WHERE content_type = 'page' AND slug = 'about';
UPDATE public.content_registry SET public_route = '/work',   updated_at = NOW() WHERE content_type = 'page' AND slug IN ('work', 'case-studies');
UPDATE public.content_registry SET public_route = '/agents', updated_at = NOW() WHERE content_type = 'page' AND slug = 'agents';
UPDATE public.content_registry SET public_route = '/blog',   updated_at = NOW() WHERE content_type = 'page' AND slug = 'blog';
UPDATE public.content_registry SET public_route = '/copilot',updated_at = NOW() WHERE content_type = 'page' AND slug = 'copilot';
UPDATE public.content_registry SET public_route = '/plugins',updated_at = NOW() WHERE content_type = 'page' AND slug = 'plugins';

-- Keep the mirrored metadata.public_route in sync where present.
UPDATE public.content_registry
SET metadata = metadata || jsonb_build_object('public_route', public_route)
WHERE content_type = 'page'
  AND metadata ? 'public_route'
  AND metadata->>'public_route' IS DISTINCT FROM public_route;
