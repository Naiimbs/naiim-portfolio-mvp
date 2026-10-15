-- ==============================================================================
-- MIGRATION: 025_seed_about_page_cms.sql
-- Description: Seed the About page (/about) as an editable CMS page
--              composed of the 9 modular proposal sections (docs/about-me-page-proposal.md):
--              1. about_hero       (Hero — Beyond a Job Title)
--              2. about_journey    (My Journey — From Mechanical to AI)
--              3. about_philosophy (How I Think — Philosophy)
--              4. about_expertise  (What I Do — Areas of Expertise)
--              5. about_proof      (Selected Work — Proof, Not Claims)
--              6. about_share      (Beyond the Portfolio — What I Share)
--              7. about_building   (Currently Building — Spotlight)
--              8. about_human      (Beyond Work — The Person Behind)
--              9. about_closing    (Let's Build Something Meaningful)
--
-- Safety:
--   * Cleans up legacy generic mock blocks (hero/rich_text/timeline/workflow/cta)
--     so old content never overlays or conflicts with the proposal.
--   * Idempotent: re-running keeps existing customized proposal blocks intact.
-- ==============================================================================

DO $$
DECLARE
  v_page_id UUID;
  v_has_legacy BOOLEAN;
  v_section_count INT;
BEGIN
  -- 1. Ensure the 'about' page row exists
  SELECT id INTO v_page_id FROM public.pages WHERE slug = 'about';
  IF v_page_id IS NULL THEN
    INSERT INTO public.pages (slug, title, status, template, seo_title, seo_description)
    VALUES (
      'about',
      'About',
      'published',
      'default',
      'About — Naïm Bsili | Product Designer & AI Builder',
      'Career journey, product design philosophy, and AI automation expertise of Naïm Bsili.'
    )
    RETURNING id INTO v_page_id;
  END IF;

  -- 2. Check for legacy mock sections (hero, rich_text, timeline, workflow, cta)
  SELECT EXISTS(
    SELECT 1 FROM public.page_sections
    WHERE page_id = v_page_id
      AND section_type IN ('hero', 'rich_text', 'timeline', 'workflow', 'cta')
  ) INTO v_has_legacy;

  IF v_has_legacy THEN
    DELETE FROM public.page_sections
    WHERE page_id = v_page_id
      AND section_type IN ('hero', 'rich_text', 'timeline', 'workflow', 'cta');
  END IF;

  -- 3. Seed the 9 modular proposal sections if none exist yet
  SELECT COUNT(*) INTO v_section_count FROM public.page_sections WHERE page_id = v_page_id;
  IF v_section_count = 0 THEN
    INSERT INTO public.page_sections (page_id, section_type, label, sort_order, is_visible, config) VALUES
      (
        v_page_id,
        'about_hero',
        'About · 01 Hero — Beyond a Job Title',
        10,
        true,
        jsonb_build_object(
          'eyebrow', 'PRODUCT DESIGNER · AI BUILDER',
          'headline', 'I DESIGN. I BUILD. I EXPERIMENT.',
          'lead', 'I turn complex problems into usable digital products through product design, AI, low-code, and automation.',
          'exploreCta', jsonb_build_object('label', 'Explore My Work', 'href', '/work'),
          'talkCta', jsonb_build_object('label', 'Let''s Talk', 'href', '/about#contact'),
          'buildingNote', 'WINNI Identity Ecosystem · Naïm Copilot · AI Agent Protocols',
          'portraitUrl', ''
        )
      ),
      (
        v_page_id,
        'about_journey',
        'About · 02 My Journey — From Mechanical to AI',
        20,
        true,
        jsonb_build_object(
          'eyebrow', 'SIGNATURE EVOLUTION',
          'title', 'From Mechanical Design to AI',
          'subtitle', 'A visual progression connecting physical engineering, visual craft, human-centered UX, low-code delivery, and autonomous AI systems.'
        )
      ),
      (
        v_page_id,
        'about_philosophy',
        'About · 03 How I Think — Philosophy',
        30,
        true,
        jsonb_build_object(
          'eyebrow', 'HOW I THINK',
          'title', 'Principles over trends.',
          'intro', 'Tools evolve every month, but how you approach problems remains your true craft. Here is how I think before touching any tool.',
          'signatureStatement', '"I think. I design. I experiment."'
        )
      ),
      (
        v_page_id,
        'about_expertise',
        'About · 04 What I Do — Expertise',
        40,
        true,
        jsonb_build_object(
          'eyebrow', 'AREAS OF EXPERTISE',
          'title', 'What I Bring to Products',
          'subtitle', 'Structured capability groups reflecting proven hands-on delivery.'
        )
      ),
      (
        v_page_id,
        'about_proof',
        'About · 05 Selected Work — Proof, Not Claims',
        50,
        true,
        jsonb_build_object(
          'eyebrow', 'PROOF, NOT CLAIMS',
          'title', 'Selected Work & Artifacts'
        )
      ),
      (
        v_page_id,
        'about_share',
        'About · 06 Beyond Portfolio — What I Share',
        60,
        true,
        jsonb_build_object(
          'eyebrow', 'KNOWLEDGE SHARING',
          'title', 'Beyond the Portfolio',
          'hours', '1,200+',
          'learners', '300+',
          'articles', '20+'
        )
      ),
      (
        v_page_id,
        'about_building',
        'About · 07 Currently Building — Spotlight',
        70,
        true,
        jsonb_build_object(
          'title', 'WINNI Identity & Autonomous Agent Protocols',
          'stage', 'ACTIVE DEVELOPMENT',
          'description', 'Refining the physical-to-digital QR/NFC recovery flow and experimenting with autonomous agent orchestration via Model Context Protocol (MCP) to make physical objects interact with intelligent workflows.',
          'link', '/#lab'
        )
      ),
      (
        v_page_id,
        'about_human',
        'About · 08 Beyond Work — The Person',
        80,
        true,
        jsonb_build_object(
          'eyebrow', 'THE PERSON BEHIND',
          'title', 'Curiosity as the continuous thread.',
          'story', 'Behind every design system and agentic workflow is a deep curiosity about how things work. Whether dismantling a mechanical mechanism, observing how people handle friction in everyday tasks, or writing automation logic, the common thread is transforming ideas into something tangible and useful.'
        )
      ),
      (
        v_page_id,
        'about_closing',
        'About · 09 Let''s Build Something Meaningful',
        90,
        true,
        jsonb_build_object(
          'eyebrow', 'GET IN TOUCH',
          'title', 'Let''s Build Something Meaningful',
          'description', 'I''m interested in meaningful product challenges where design, technology, and AI come together. Whether you are building an ambitious system or exploring workflow automation, let''s talk.',
          'exploreLabel', 'Explore My Work',
          'email', 'contact@naiimbsili.com'
        )
      );
  END IF;

  -- 4. Ensure Content Registry row for 'about' is published & public
  INSERT INTO public.content_registry (slug, content_type, title, status, visibility, public_route)
  VALUES ('about', 'page', 'About', 'published', 'public', '/about')
  ON CONFLICT (slug) DO UPDATE
    SET status = 'published',
        visibility = 'public',
        public_route = '/about',
        updated_at = NOW();

END $$;
