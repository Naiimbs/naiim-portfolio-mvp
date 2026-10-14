-- ==============================================================================
-- MIGRATION: 018_seed_work_page_cms.sql
-- Description: Seed the Work page (/work) as an editable CMS page (Approach A),
--              composed of the `work_catalog` composite section (editable
--              heading + Content-Registry-driven case-study catalog).
--
-- Safety:
--   * Seeded as DRAFT (pages.status='draft' + content_registry.status='draft'),
--     so /work keeps rendering the current catalog until an editor previews it
--     (/work?preview=true) and explicitly publishes.
--   * Idempotent: re-running does not duplicate the page or its sections.
--
-- To PUBLISH after validating the preview:
--   UPDATE public.pages
--     SET status='published', published_at=NOW() WHERE slug='work';
--   UPDATE public.content_registry
--     SET status='published', visibility='public', public_route='/work' WHERE slug='work';
--
-- To ROLL BACK to the previous /work page:
--   UPDATE public.pages SET status='draft' WHERE slug='work';
--   UPDATE public.content_registry SET status='draft' WHERE slug='work';
-- ==============================================================================

DO $$
DECLARE
  v_page_id UUID;
  v_section_count INT;
BEGIN
  SELECT id INTO v_page_id FROM public.pages WHERE slug = 'work';
  IF v_page_id IS NULL THEN
    INSERT INTO public.pages (slug, title, status, template, seo_title, seo_description)
    VALUES (
      'work',
      'Work',
      'draft',
      'default',
      'Selected Work — Naim Bsili',
      'Case studies and digital products by Naim Bsili — Product Designer and AI Builder.'
    )
    RETURNING id INTO v_page_id;
  END IF;

  SELECT COUNT(*) INTO v_section_count FROM public.page_sections WHERE page_id = v_page_id;
  IF v_section_count = 0 THEN
    INSERT INTO public.page_sections (page_id, section_type, label, sort_order, is_visible, config) VALUES
      (v_page_id, 'work_catalog', 'Work · Catalog', 10, true, '{}'::jsonb);
  END IF;

  INSERT INTO public.content_registry (slug, content_type, title, status, visibility, public_route)
  VALUES ('work', 'page', 'Work', 'draft', 'public', '/work')
  ON CONFLICT (slug) DO NOTHING;
END $$;
