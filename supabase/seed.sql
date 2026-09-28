-- ==============================================================================
-- SUPABASE CMS SEED SCRIPT: seed.sql
-- Description: Seeds the 9 initial portfolio projects and standard/custom case studies.
-- ==============================================================================

DO $$
DECLARE
    p_winni_id UUID := '00000000-0000-0000-0000-000000000001';
    p_assestini_id UUID := '00000000-0000-0000-0000-000000000002';
    p_cha9a9a_id UUID := '00000000-0000-0000-0000-000000000003';
    p_copilot_id UUID := '00000000-0000-0000-0000-000000000004';
    p_career_id UUID := '00000000-0000-0000-0000-000000000005';
    p_saudi_gov_id UUID := '00000000-0000-0000-0000-000000000006';
    p_saudi_bank_id UUID := '00000000-0000-0000-0000-000000000007';
    p_dga_id UUID := '00000000-0000-0000-0000-000000000008';
    p_saudi_reg_id UUID := '00000000-0000-0000-0000-000000000009';

    cs_cha9a9a_id UUID := uuid_generate_v4();
    s_c9_hero_id UUID := uuid_generate_v4();
    s_c9_challenge_id UUID := uuid_generate_v4();
    s_c9_contrib_id UUID := uuid_generate_v4();
    s_c9_evidence_id UUID := uuid_generate_v4();
    s_c9_tech_id UUID := uuid_generate_v4();
BEGIN

    -- 1. INSERT PROJECTS
    INSERT INTO public.projects (id, slug, title, kicker, short_description, category, year, roles, tools, is_featured, sort_order, status)
    VALUES
        (p_winni_id, 'winni', 'WINNI', 'PRODUCT · QR · LOST & FOUND', 'A QR-powered recovery experience designed around one principle: the finder should not have to become a user.', 'Product Design', 2026, ARRAY['Product Designer', 'UX/UI', 'AI'], ARRAY['Figma', 'React', 'QR/NFC'], true, 1, 'published'),
        (p_assestini_id, 'assestini', 'Assestini', 'PRODUCT · OPERATIONAL INTELLIGENCE', 'Designing an operational layer that connects estimation, delivery, margins, cash flow and AI-assisted decisions.', 'Product Design', 2026, ARRAY['Product Designer', 'AI', 'RAG'], ARRAY['Figma', 'RAG', 'AI'], true, 2, 'published'),
        (p_cha9a9a_id, 'cha9a9a', 'Cha9a9a', 'WEB · FIGMA → CODE', 'Translating a Figma interface into responsive HTML, CSS, Bootstrap and JavaScript for a community platform.', 'Front-End', 2026, ARRAY['Front-End', 'Bootstrap', 'Figma'], ARRAY['HTML', 'CSS', 'Bootstrap', 'JavaScript', 'Figma'], true, 3, 'published'),
        (p_copilot_id, 'naim-copilot', 'Naïm Copilot', 'AI AGENT', 'AI Agent · n8n · Memory · Actions', 'AI Agent', 2026, ARRAY['AI Workflow Builder', 'Product Designer'], ARRAY['n8n', 'OpenAI', 'RAG'], false, 4, 'published'),
        (p_career_id, 'career-os', 'Career OS', 'AI AUTOMATION', 'Daily Job Search · AI scoring', 'AI Automation', 2026, ARRAY['Product Designer', 'AI Workflow Builder'], ARRAY['n8n', 'Gemini', 'Telegram'], false, 5, 'published'),
        (p_saudi_gov_id, 'saudi-government', 'Saudi · Government', 'DIGITAL SERVICES', 'Digital services · UX/UI · OutSystems', 'Digital Services', 2025, ARRAY['Senior UX/UI Designer'], ARRAY['OutSystems', 'Figma'], false, 6, 'published'),
        (p_saudi_bank_id, 'saudi-banking', 'Saudi · Banking', 'FINANCIAL SERVICES', 'Financial services · UX/UI · Mendix', 'Financial Services', 2025, ARRAY['Senior UX/UI Designer'], ARRAY['Mendix', 'Figma'], false, 7, 'published'),
        (p_dga_id, 'dga', 'DGA Experience', 'GOVERNMENT DESIGN SYSTEM', 'Government design system · UI · OutSystems', 'Design Systems', 2025, ARRAY['Design Systems Lead', 'UI Designer'], ARRAY['OutSystems', 'Figma'], false, 8, 'published'),
        (p_saudi_reg_id, 'saudi-regulatory', 'Saudi · Regulatory', 'REGULATED DIGITAL SERVICES', 'Regulated digital services · UX/UI · OutSystems', 'Regulated Services', 2025, ARRAY['Senior UX/UI Designer'], ARRAY['OutSystems', 'Figma'], false, 9, 'published')
    ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        kicker = EXCLUDED.kicker,
        short_description = EXCLUDED.short_description,
        status = EXCLUDED.status;

    -- 2. INSERT CASE STUDIES (Custom & Standard)
    INSERT INTO public.case_studies (project_id, type, title, subtitle, seo_title, seo_description, canonical_path, status)
    VALUES
        (p_winni_id, 'custom', 'WINNI', 'Giving lost things a way back.', 'WINNI — Case Study · Naïm Bsili', 'WINNI is a physical + digital identity system that helps people reconnect with lost belongings through a simple QR/NFC interaction.', '/work/winni', 'published'),
        (p_assestini_id, 'custom', 'Assestini', 'Operational Intelligence Platform', 'Assestini — Case Study · Naïm Bsili', 'Assestini — AI-powered Operational Intelligence Platform. Product design case study by Naïm Bsili. From estimation to payment in one connected workflow.', '/work/assestini', 'published'),
        (p_cha9a9a_id, 'standard', 'Cha9a9a', 'Turning a Figma interface into a responsive HTML/CSS/Bootstrap/JavaScript experience.', 'Cha9a9a — Case Study · Naïm Bsili', 'Translating a Figma interface into responsive HTML, CSS, Bootstrap and JavaScript for a community platform.', '/work/cha9a9a', 'published')
    ON CONFLICT (project_id) DO NOTHING;

    -- 3. INSERT STANDARD CASE STUDY SECTIONS (Example: Cha9a9a)
    SELECT id INTO cs_cha9a9a_id FROM public.case_studies WHERE project_id = p_cha9a9a_id;

    IF cs_cha9a9a_id IS NOT NULL THEN
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES
            (s_c9_hero_id, cs_cha9a9a_id, 'hero', 'Cha9a9a', 'WEB DESIGN → FRONT-END INTEGRATION', 1, true),
            (s_c9_challenge_id, cs_cha9a9a_id, 'challenge', 'Translate a visual concept into a responsive, usable web experience.', 'THE CHALLENGE', 2, true),
            (s_c9_contrib_id, cs_cha9a9a_id, 'contribution', 'From Figma handoff to implementation.', 'MY CONTRIBUTION', 3, true),
            (s_c9_evidence_id, cs_cha9a9a_id, 'evidence', 'A snapshot of the interface I translated into front-end.', 'DESIGN → CODE', 4, true),
            (s_c9_tech_id, cs_cha9a9a_id, 'technology', 'Tools and technologies', 'TECHNOLOGY', 5, true)
        ON CONFLICT (id) DO NOTHING;

        -- Section Blocks for Cha9a9a
        INSERT INTO public.section_blocks (section_id, block_type, content, order_index, is_visible)
        VALUES
            (s_c9_hero_id, 'hero_content', '{"lead": "Turning a Figma interface into a responsive HTML/CSS/Bootstrap/JavaScript experience for a community platform.", "metaChips": ["Cha9a9a.tn / web under construction", "UI Developer · Front-End Integrator"]}'::jsonb, 1, true),
            (s_c9_challenge_id, 'challenge_content', '{"copy": "Cha9a9a is a community-oriented platform concept. My role focused on taking the approved Figma direction and translating it into a responsive front-end experience while preserving the visual hierarchy, cards, calls to action and content rhythm.", "role": "UI Developer · Front-End Integrator", "context": "Cha9a9a.tn · website currently under construction"}'::jsonb, 1, true),
            (s_c9_contrib_id, 'contribution_content', '{"items": ["Integrated the approved Figma mockups into semantic HTML.", "Built responsive layouts with CSS and Bootstrap.", "Implemented interactive behaviors with JavaScript.", "Translated cards, navigation, hero sections, categories and FAQ patterns into reusable UI structures."], "process": [{"step": "01", "title": "Read", "desc": "Understand the Figma structure, components, spacing and hierarchy."}, {"step": "02", "title": "Translate", "desc": "Convert visual decisions into semantic HTML and Bootstrap layout."}, {"step": "03", "title": "Refine", "desc": "Tune CSS, typography, spacing and responsive behavior."}, {"step": "04", "title": "Validate", "desc": "Compare browser output with the intended design and iterate."}]}'::jsonb, 1, true),
            (s_c9_tech_id, 'technology_tags', '{"tags": ["Figma", "HTML", "CSS", "Bootstrap", "JavaScript", "Responsive UI"]}'::jsonb, 1, true)
        ON CONFLICT (id) DO NOTHING;
    END IF;

END $$;
