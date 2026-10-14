-- ==============================================================================
-- MIGRATION: 017_seed_home_page_cms.sql
-- Description: Seed the Home page as an editable CMS page (Approach A).
--              The page is composed of the real homepage blocks exposed as
--              composite CMS section types (home_hero, selected_work,
--              case_studies_strip, copilot_career, lab, home_about, home_contact).
--
-- Safety:
--   * Seeded as DRAFT (pages.status='draft' + content_registry.status='draft'),
--     so the PUBLIC site keeps rendering the current hardcoded homepage until an
--     editor previews it (/?preview=true) and explicitly publishes.
--   * Idempotent: re-running does not duplicate the page or its sections.
--
-- To PUBLISH after validating the preview, run (keeps the canonical '/' route):
--   UPDATE public.pages
--     SET status='published', published_at=NOW() WHERE slug='home';
--   UPDATE public.content_registry
--     SET status='published', visibility='public', public_route='/' WHERE slug='home';
--
-- To ROLL BACK to the hardcoded homepage:
--   UPDATE public.pages SET status='draft' WHERE slug='home';
--   UPDATE public.content_registry SET status='draft' WHERE slug='home';
-- ==============================================================================

DO $$
DECLARE
  v_page_id UUID;
  v_section_count INT;
BEGIN
  -- 1. Ensure a 'home' page row exists (draft).
  SELECT id INTO v_page_id FROM public.pages WHERE slug = 'home';
  IF v_page_id IS NULL THEN
    INSERT INTO public.pages (slug, title, status, template, seo_title, seo_description)
    VALUES (
      'home',
      'Home',
      'draft',
      'default',
      'Naïm Bsili — Product Designer & AI Builder',
      'Senior UX/UI Designer & AI Product Builder. Turning ambiguous problems into usable digital products across product design, AI, low-code and automation.'
    )
    RETURNING id INTO v_page_id;
  END IF;

  -- 2. Seed the homepage blocks only if this page has no sections yet.
  SELECT COUNT(*) INTO v_section_count FROM public.page_sections WHERE page_id = v_page_id;
  IF v_section_count = 0 THEN
    INSERT INTO public.page_sections (page_id, section_type, label, sort_order, is_visible, config) VALUES
      (v_page_id, 'home_hero',          'Home · Hero',               10, true, '{}'::jsonb),
      (v_page_id, 'selected_work',      'Home · Selected Work',      20, true, '{}'::jsonb),
      (v_page_id, 'case_studies_strip', 'Home · Case Studies Strip', 30, true, '{}'::jsonb),
      (v_page_id, 'copilot_career',     'Home · Copilot + Career',   40, true, '{}'::jsonb),
      (v_page_id, 'lab',                'Home · Lab',                50, true, '{}'::jsonb),
      (v_page_id, 'home_about',         'Home · About',              60, true, '{}'::jsonb),
      (v_page_id, 'home_contact',       'Home · Contact',            70, true, '{}'::jsonb);
  END IF;

  -- 3. Ensure a content_registry row exists for 'home' (draft → not yet public).
  INSERT INTO public.content_registry (slug, content_type, title, status, visibility, public_route)
  VALUES ('home', 'page', 'Home', 'draft', 'public', '/')
  ON CONFLICT (slug) DO NOTHING;
END $$;
