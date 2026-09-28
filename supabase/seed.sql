-- ==============================================================================
-- SUPABASE CMS SEED SCRIPT: seed.sql
-- Description: Seeds the 9 initial portfolio projects and standard/custom case studies.
-- Includes full section and block hierarchies for all 7 standard case studies.
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

    cs_id UUID;
    sec_hero UUID;
    sec_chal UUID;
    sec_cont UUID;
    sec_evid UUID;
    sec_tech UUID;
BEGIN

    -- 1. INSERT / UPDATE PROJECTS
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

    -- 2. INSERT / UPDATE CASE STUDIES
    INSERT INTO public.case_studies (project_id, type, title, subtitle, seo_title, seo_description, canonical_path, status)
    VALUES
        (p_winni_id, 'custom', 'WINNI', 'Giving lost things a way back.', 'WINNI — Case Study · Naïm Bsili', 'WINNI is a physical + digital identity system that helps people reconnect with lost belongings through a simple QR/NFC interaction.', '/work/winni', 'published'),
        (p_assestini_id, 'custom', 'Assestini', 'Operational Intelligence Platform', 'Assestini — Case Study · Naïm Bsili', 'Assestini — AI-powered Operational Intelligence Platform. Product design case study by Naïm Bsili. From estimation to payment in one connected workflow.', '/work/assestini', 'published'),
        (p_cha9a9a_id, 'standard', 'Cha9a9a', 'Turning a Figma interface into a responsive HTML/CSS/Bootstrap/JavaScript experience for a community platform.', 'Cha9a9a — Case Study · Naïm Bsili', 'Translating a Figma interface into responsive HTML, CSS, Bootstrap and JavaScript for a community platform.', '/work/cha9a9a', 'published'),
        (p_copilot_id, 'standard', 'Naïm Copilot', 'A personal AI agent that connects memory, knowledge, projects and actions so work can be queried and updated through a single conversational interface.', 'Naïm Copilot — Case Study · Naïm Bsili', 'A personal AI agent that connects memory, knowledge, projects and actions.', '/work/naim-copilot', 'published'),
        (p_career_id, 'standard', 'Career OS · Daily Job Search', 'An automated career-search workflow that collects opportunities, removes duplicates, scores fit and sends a focused daily digest.', 'Career OS · Daily Job Search — Case Study · Naïm Bsili', 'An automated career-search workflow that collects opportunities, removes duplicates, scores fit and sends a focused daily digest.', '/work/career-os', 'published'),
        (p_saudi_gov_id, 'standard', 'Saudi · Government Digital Services', 'UX/UI and low-code product work delivered through ENVNT / Wevioo for Saudi digital environments. Client project names are intentionally omitted from the public portfolio.', 'Saudi · Government Digital Services — Case Study · Naïm Bsili', 'UX/UI and low-code product work delivered through ENVNT / Wevioo for Saudi digital environments.', '/work/saudi-government', 'published'),
        (p_saudi_bank_id, 'standard', 'Saudi · Banking & Financial Services', 'UX/UI and Mendix interface work in a Saudi banking environment through ENVNT / Wevioo. Confidential client and project names are intentionally omitted.', 'Saudi · Banking & Financial Services — Case Study · Naïm Bsili', 'UX/UI and Mendix interface work in a Saudi banking environment through ENVNT / Wevioo.', '/work/saudi-banking', 'published'),
        (p_dga_id, 'standard', 'DGA · Digital Government Experience', 'A focused look at my contribution to digital government UX/UI and design-system work in Saudi Arabia.', 'DGA · Digital Government Experience — Case Study · Naïm Bsili', 'A focused look at my contribution to digital government UX/UI and design-system work in Saudi Arabia.', '/work/dga', 'published'),
        (p_saudi_reg_id, 'standard', 'Saudi · Regulatory / Healthcare Digital Services', 'UX/UI and OutSystems interface work for regulated digital services through ENVNT / Wevioo, presented publicly by sector rather than client project name.', 'Saudi · Regulatory / Healthcare Digital Services — Case Study · Naïm Bsili', 'UX/UI and OutSystems interface work for regulated digital services through ENVNT / Wevioo.', '/work/saudi-regulatory', 'published')
    ON CONFLICT (project_id) DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        seo_title = EXCLUDED.seo_title,
        seo_description = EXCLUDED.seo_description,
        canonical_path = EXCLUDED.canonical_path,
        status = EXCLUDED.status;

    -- 3. SEED CHA9A9A SECTIONS & BLOCKS
    SELECT id INTO cs_id FROM public.case_studies WHERE project_id = p_cha9a9a_id;
    IF cs_id IS NOT NULL THEN
        DELETE FROM public.section_blocks WHERE section_id IN (SELECT id FROM public.case_study_sections WHERE case_study_id = cs_id);
        DELETE FROM public.case_study_sections WHERE case_study_id = cs_id;

        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES
            (uuid_generate_v4(), cs_id, 'hero', 'Cha9a9a', 'WEB DESIGN → FRONT-END INTEGRATION', 1, true) RETURNING id INTO sec_hero;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES
            (uuid_generate_v4(), cs_id, 'challenge', 'Translate a visual concept into a responsive, usable web experience.', 'THE CHALLENGE', 2, true) RETURNING id INTO sec_chal;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES
            (uuid_generate_v4(), cs_id, 'contribution', 'From Figma handoff to implementation.', 'MY CONTRIBUTION', 3, true) RETURNING id INTO sec_cont;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES
            (uuid_generate_v4(), cs_id, 'evidence', 'A snapshot of the interface I translated into front-end.', 'DESIGN → CODE', 4, true) RETURNING id INTO sec_evid;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES
            (uuid_generate_v4(), cs_id, 'technology', 'Tools and technologies', 'TECHNOLOGY', 5, true) RETURNING id INTO sec_tech;

        INSERT INTO public.section_blocks (section_id, block_type, content, order_index, is_visible) VALUES
            (sec_hero, 'hero_content', '{"lead": "Turning a Figma interface into a responsive HTML/CSS/Bootstrap/JavaScript experience for a community platform.", "metaChips": ["Cha9a9a.tn / web under construction", "UI Developer · Front-End Integrator"]}'::jsonb, 1, true),
            (sec_chal, 'challenge_content', '{"copy": "Cha9a9a is a community-oriented platform concept. My role focused on taking the approved Figma direction and translating it into a responsive front-end experience while preserving the visual hierarchy, cards, calls to action and content rhythm.", "role": "UI Developer · Front-End Integrator", "context": "Cha9a9a.tn · website currently under construction"}'::jsonb, 1, true),
            (sec_cont, 'contribution_content', '{"items": ["Integrated the approved Figma mockups into semantic HTML.", "Built responsive layouts with CSS and Bootstrap.", "Implemented interactive behaviors with JavaScript.", "Translated cards, navigation, hero sections, categories and FAQ patterns into reusable UI structures.", "Focused on visual fidelity between design and browser output.", "Prepared the implementation so content and imagery can evolve without rebuilding the interface."]}'::jsonb, 1, true),
            (sec_cont, 'process', '{"steps": [{"number": "01", "title": "Read", "description": "Understand the Figma structure, components, spacing and hierarchy."}, {"number": "02", "title": "Translate", "description": "Convert visual decisions into semantic HTML and Bootstrap layout."}, {"number": "03", "title": "Refine", "description": "Tune CSS, typography, spacing and responsive behavior."}, {"number": "04", "title": "Validate", "description": "Compare browser output with the intended design and iterate."}]}'::jsonb, 2, true),
            (sec_evid, 'image', '{"alt": "Cha9a9a.tn homepage screenshot showing the Figma-to-HTML implementation target", "caption": "Cha9a9a.tn — provided homepage reference showing the visual system, content structure and responsive UI target."}'::jsonb, 1, true),
            (sec_tech, 'technology_tags', '{"tags": ["Figma", "HTML", "CSS", "Bootstrap", "JavaScript", "Responsive UI"]}'::jsonb, 1, true);
    END IF;

    -- 4. SEED NAIM-COPILOT SECTIONS & BLOCKS
    SELECT id INTO cs_id FROM public.case_studies WHERE project_id = p_copilot_id;
    IF cs_id IS NOT NULL THEN
        DELETE FROM public.section_blocks WHERE section_id IN (SELECT id FROM public.case_study_sections WHERE case_study_id = cs_id);
        DELETE FROM public.case_study_sections WHERE case_study_id = cs_id;

        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'hero', 'Naïm Copilot', 'AI SYSTEM · N8N · PERSONAL OPERATING LAYER', 1, true) RETURNING id INTO sec_hero;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'challenge', 'A clear problem deserves a clear product response.', 'THE CHALLENGE', 2, true) RETURNING id INTO sec_chal;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'contribution', 'From ambiguity to a usable system.', 'WHAT I DID', 3, true) RETURNING id INTO sec_cont;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'evidence', 'The work behind the interface.', 'SELECTED EVIDENCE', 4, true) RETURNING id INTO sec_evid;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'technology', 'Technology', 'TECHNOLOGY', 5, true) RETURNING id INTO sec_tech;

        INSERT INTO public.section_blocks (section_id, block_type, content, order_index, is_visible) VALUES
            (sec_hero, 'hero_content', '{"lead": "A personal AI agent that connects memory, knowledge, projects and actions so work can be queried and updated through a single conversational interface.", "metaChips": ["Personal AI system", "AI Product Designer · AI Builder · Automation Architect"]}'::jsonb, 1, true),
            (sec_chal, 'challenge_content', '{"copy": "How can one assistant understand my professional context, remember decisions, search projects and trigger actions instead of behaving like a generic chatbot?", "role": "AI Product Designer · AI Builder · Automation Architect", "context": "Personal AI system"}'::jsonb, 1, true),
            (sec_cont, 'contribution_content', '{"items": ["Designed the conversational operating model around memory, knowledge and project state.", "Built an n8n workflow for Telegram text and voice input.", "Connected PostgreSQL chat memory and structured knowledge.", "Added project search, project update, decision context and action planning tools."]}'::jsonb, 1, true),
            (sec_cont, 'process', '{"steps": [{"number": "01", "title": "Frame", "description": "Clarify the problem, users and constraints."}, {"number": "02", "title": "Structure", "description": "Turn requirements into flows and product logic."}, {"number": "03", "title": "Design", "description": "Create clear, reusable and implementation-ready UI."}, {"number": "04", "title": "Build", "description": "Connect the design to technology and iterate."}]}'::jsonb, 2, true),
            (sec_evid, 'image', '{"alt": "Naïm Copilot n8n workflow screenshot showing Telegram, AI Agent, memory and project tools"}'::jsonb, 1, true),
            (sec_tech, 'technology_tags', '{"tags": ["n8n", "Google Gemini", "PostgreSQL", "Telegram", "AI Agents", "RAG", "MCP", "Automation"]}'::jsonb, 1, true);
    END IF;

    -- 5. SEED CAREER-OS SECTIONS & BLOCKS
    SELECT id INTO cs_id FROM public.case_studies WHERE project_id = p_career_id;
    IF cs_id IS NOT NULL THEN
        DELETE FROM public.section_blocks WHERE section_id IN (SELECT id FROM public.case_study_sections WHERE case_study_id = cs_id);
        DELETE FROM public.case_study_sections WHERE case_study_id = cs_id;

        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'hero', 'Career OS · Daily Job Search', 'AI AUTOMATION · JOB SEARCH · SCORING', 1, true) RETURNING id INTO sec_hero;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'challenge', 'A clear problem deserves a clear product response.', 'THE CHALLENGE', 2, true) RETURNING id INTO sec_chal;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'contribution', 'From ambiguity to a usable system.', 'WHAT I DID', 3, true) RETURNING id INTO sec_cont;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'evidence', 'The work behind the interface.', 'SELECTED EVIDENCE', 4, true) RETURNING id INTO sec_evid;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'technology', 'Technology', 'TECHNOLOGY', 5, true) RETURNING id INTO sec_tech;

        INSERT INTO public.section_blocks (section_id, block_type, content, order_index, is_visible) VALUES
            (sec_hero, 'hero_content', '{"lead": "An automated career-search workflow that collects opportunities, removes duplicates, scores fit and sends a focused daily digest.", "metaChips": ["Personal automation system", "Product Designer · AI Workflow Builder"]}'::jsonb, 1, true),
            (sec_chal, 'challenge_content', '{"copy": "How can repetitive job searching become a consistent pipeline where relevant roles are collected, evaluated and prioritized automatically?", "role": "Product Designer · AI Workflow Builder", "context": "Personal automation system"}'::jsonb, 1, true),
            (sec_cont, 'contribution_content', '{"items": ["Combined multiple remote job sources.", "Flattened and deduplicated results to keep only new URLs.", "Used an AI scoring step to assess fit against the career profile.", "Saved results to a pipeline and delivered email / Telegram digests."]}'::jsonb, 1, true),
            (sec_cont, 'process', '{"steps": [{"number": "01", "title": "Frame", "description": "Clarify the problem, users and constraints."}, {"number": "02", "title": "Structure", "description": "Turn requirements into flows and product logic."}, {"number": "03", "title": "Design", "description": "Create clear, reusable and implementation-ready UI."}, {"number": "04", "title": "Build", "description": "Connect the design to technology and iterate."}]}'::jsonb, 2, true),
            (sec_evid, 'image', '{"alt": "Career OS n8n workflow screenshot showing job sources, deduplication, AI fit scoring and digest"}'::jsonb, 1, true),
            (sec_tech, 'technology_tags', '{"tags": ["n8n", "Google Gemini", "Job APIs", "PostgreSQL", "AI scoring", "Email", "Telegram"]}'::jsonb, 1, true);
    END IF;

    -- 6. SEED SAUDI-GOVERNMENT SECTIONS & BLOCKS
    SELECT id INTO cs_id FROM public.case_studies WHERE project_id = p_saudi_gov_id;
    IF cs_id IS NOT NULL THEN
        DELETE FROM public.section_blocks WHERE section_id IN (SELECT id FROM public.case_study_sections WHERE case_study_id = cs_id);
        DELETE FROM public.case_study_sections WHERE case_study_id = cs_id;

        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'hero', 'Saudi · Government Digital Services', 'SAUDI ARABIA · GOVERNMENT SECTOR', 1, true) RETURNING id INTO sec_hero;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'challenge', 'A clear problem deserves a clear product response.', 'THE CHALLENGE', 2, true) RETURNING id INTO sec_chal;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'contribution', 'From ambiguity to a usable system.', 'WHAT I DID', 3, true) RETURNING id INTO sec_cont;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'evidence', 'The work behind the interface.', 'SELECTED EVIDENCE', 4, true) RETURNING id INTO sec_evid;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'technology', 'Technology', 'TECHNOLOGY', 5, true) RETURNING id INTO sec_tech;

        INSERT INTO public.section_blocks (section_id, block_type, content, order_index, is_visible) VALUES
            (sec_hero, 'hero_content', '{"lead": "UX/UI and low-code product work delivered through ENVNT / Wevioo for Saudi digital environments. Client project names are intentionally omitted from the public portfolio.", "metaChips": ["ENVNT / Wevioo · Saudi Arabia", "Senior UX/UI Designer · UI Developer"]}'::jsonb, 1, true),
            (sec_chal, 'challenge_content', '{"copy": "How can complex government requirements and workflows become clear, consistent and production-ready digital interfaces?", "role": "Senior UX/UI Designer · UI Developer", "context": "ENVNT / Wevioo · Saudi Arabia"}'::jsonb, 1, true),
            (sec_cont, 'contribution_content', '{"items": ["Translated requirements and workflows into usable interfaces.", "Designed responsive screens and reusable UI patterns.", "Collaborated with business and development teams.", "Implemented UI in OutSystems where required."]}'::jsonb, 1, true),
            (sec_cont, 'process', '{"steps": [{"number": "01", "title": "Frame", "description": "Clarify the problem, users and constraints."}, {"number": "02", "title": "Structure", "description": "Turn requirements into flows and product logic."}, {"number": "03", "title": "Design", "description": "Create clear, reusable and implementation-ready UI."}, {"number": "04", "title": "Build", "description": "Connect the design to technology and iterate."}]}'::jsonb, 2, true),
            (sec_evid, 'image', '{"alt": "approved Saudi government digital service interface screenshot, with confidential project names removed"}'::jsonb, 1, true),
            (sec_tech, 'technology_tags', '{"tags": ["Figma", "UX/UI", "OutSystems", "Design Systems", "Responsive UI"]}'::jsonb, 1, true);
    END IF;

    -- 7. SEED SAUDI-BANKING SECTIONS & BLOCKS
    SELECT id INTO cs_id FROM public.case_studies WHERE project_id = p_saudi_bank_id;
    IF cs_id IS NOT NULL THEN
        DELETE FROM public.section_blocks WHERE section_id IN (SELECT id FROM public.case_study_sections WHERE case_study_id = cs_id);
        DELETE FROM public.case_study_sections WHERE case_study_id = cs_id;

        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'hero', 'Saudi · Banking & Financial Services', 'SAUDI ARABIA · BANKING SECTOR', 1, true) RETURNING id INTO sec_hero;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'challenge', 'A clear problem deserves a clear product response.', 'THE CHALLENGE', 2, true) RETURNING id INTO sec_chal;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'contribution', 'From ambiguity to a usable system.', 'WHAT I DID', 3, true) RETURNING id INTO sec_cont;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'evidence', 'The work behind the interface.', 'SELECTED EVIDENCE', 4, true) RETURNING id INTO sec_evid;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'technology', 'Technology', 'TECHNOLOGY', 5, true) RETURNING id INTO sec_tech;

        INSERT INTO public.section_blocks (section_id, block_type, content, order_index, is_visible) VALUES
            (sec_hero, 'hero_content', '{"lead": "UX/UI and Mendix interface work in a Saudi banking environment through ENVNT / Wevioo. Confidential client and project names are intentionally omitted.", "metaChips": ["ENVNT / Wevioo · Saudi Arabia", "UX Designer · Mendix UI Developer"]}'::jsonb, 1, true),
            (sec_chal, 'challenge_content', '{"copy": "How can business requirements, use cases and workflows be translated into a clear banking interface that can be implemented in a low-code environment?", "role": "UX Designer · Mendix UI Developer", "context": "ENVNT / Wevioo · Saudi Arabia"}'::jsonb, 1, true),
            (sec_cont, 'contribution_content', '{"items": ["Translated SRS, use cases and workflows into Figma interfaces.", "Worked with BA and development teams to clarify the experience.", "Implemented UI components and screens in Mendix.", "Worked within the context of regulated financial services."]}'::jsonb, 1, true),
            (sec_cont, 'process', '{"steps": [{"number": "01", "title": "Frame", "description": "Clarify the problem, users and constraints."}, {"number": "02", "title": "Structure", "description": "Turn requirements into flows and product logic."}, {"number": "03", "title": "Design", "description": "Create clear, reusable and implementation-ready UI."}, {"number": "04", "title": "Build", "description": "Connect the design to technology and iterate."}]}'::jsonb, 2, true),
            (sec_evid, 'image', '{"alt": "approved Saudi banking interface evidence skeleton"}'::jsonb, 1, true),
            (sec_tech, 'technology_tags', '{"tags": ["Figma", "Mendix", "UX/UI", "SRS", "Low-Code", "Design Systems"]}'::jsonb, 1, true);
    END IF;

    -- 8. SEED DGA SECTIONS & BLOCKS
    SELECT id INTO cs_id FROM public.case_studies WHERE project_id = p_dga_id;
    IF cs_id IS NOT NULL THEN
        DELETE FROM public.section_blocks WHERE section_id IN (SELECT id FROM public.case_study_sections WHERE case_study_id = cs_id);
        DELETE FROM public.case_study_sections WHERE case_study_id = cs_id;

        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'hero', 'DGA · Digital Government Experience', 'SAUDI ARABIA · DIGITAL GOVERNMENT', 1, true) RETURNING id INTO sec_hero;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'challenge', 'A clear problem deserves a clear product response.', 'THE CHALLENGE', 2, true) RETURNING id INTO sec_chal;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'contribution', 'From ambiguity to a usable system.', 'WHAT I DID', 3, true) RETURNING id INTO sec_cont;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'evidence', 'The work behind the interface.', 'SELECTED EVIDENCE', 4, true) RETURNING id INTO sec_evid;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'technology', 'Technology', 'TECHNOLOGY', 5, true) RETURNING id INTO sec_tech;

        INSERT INTO public.section_blocks (section_id, block_type, content, order_index, is_visible) VALUES
            (sec_hero, 'hero_content', '{"lead": "A focused look at my contribution to digital government UX/UI and design-system work in Saudi Arabia.", "metaChips": ["ENVNT / Wevioo · Saudi Arabia", "UX/UI Designer · Design System Contributor · OutSystems UI"]}'::jsonb, 1, true),
            (sec_chal, 'challenge_content', '{"copy": "How can government interfaces remain consistent, accessible and implementation-ready across digital services?", "role": "UX/UI Designer · Design System Contributor · OutSystems UI", "context": "ENVNT / Wevioo · Saudi Arabia"}'::jsonb, 1, true),
            (sec_cont, 'contribution_content', '{"items": ["Worked on UX/UI for digital government services.", "Contributed to reusable design-system patterns.", "Translated visual design into OutSystems UI.", "Collaborated with delivery teams across design and development."]}'::jsonb, 1, true),
            (sec_cont, 'process', '{"steps": [{"number": "01", "title": "Frame", "description": "Clarify the problem, users and constraints."}, {"number": "02", "title": "Structure", "description": "Turn requirements into flows and product logic."}, {"number": "03", "title": "Design", "description": "Create clear, reusable and implementation-ready UI."}, {"number": "04", "title": "Build", "description": "Connect the design to technology and iterate."}]}'::jsonb, 2, true),
            (sec_evid, 'image', '{"alt": "approved DGA-related interface or design-system screenshot, with confidential project details removed"}'::jsonb, 1, true),
            (sec_tech, 'technology_tags', '{"tags": ["Figma", "Design Systems", "OutSystems", "UX/UI", "Government Digital Services"]}'::jsonb, 1, true);
    END IF;

    -- 9. SEED SAUDI-REGULATORY SECTIONS & BLOCKS
    SELECT id INTO cs_id FROM public.case_studies WHERE project_id = p_saudi_reg_id;
    IF cs_id IS NOT NULL THEN
        DELETE FROM public.section_blocks WHERE section_id IN (SELECT id FROM public.case_study_sections WHERE case_study_id = cs_id);
        DELETE FROM public.case_study_sections WHERE case_study_id = cs_id;

        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'hero', 'Saudi · Regulatory / Healthcare Digital Services', 'SAUDI ARABIA · REGULATORY / HEALTHCARE', 1, true) RETURNING id INTO sec_hero;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'challenge', 'A clear problem deserves a clear product response.', 'THE CHALLENGE', 2, true) RETURNING id INTO sec_chal;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'contribution', 'From ambiguity to a usable system.', 'WHAT I DID', 3, true) RETURNING id INTO sec_cont;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'evidence', 'The work behind the interface.', 'SELECTED EVIDENCE', 4, true) RETURNING id INTO sec_evid;
        INSERT INTO public.case_study_sections (id, case_study_id, section_type, title, eyebrow, order_index, is_visible)
        VALUES (uuid_generate_v4(), cs_id, 'technology', 'Technology', 'TECHNOLOGY', 5, true) RETURNING id INTO sec_tech;

        INSERT INTO public.section_blocks (section_id, block_type, content, order_index, is_visible) VALUES
            (sec_hero, 'hero_content', '{"lead": "UX/UI and OutSystems interface work for regulated digital services through ENVNT / Wevioo, presented publicly by sector rather than client project name.", "metaChips": ["ENVNT / Wevioo · Saudi Arabia", "UX/UI Designer · OutSystems UI"]}'::jsonb, 1, true),
            (sec_chal, 'challenge_content', '{"copy": "How can regulated service workflows be made easier to understand and use while staying consistent with an existing digital platform?", "role": "UX/UI Designer · OutSystems UI", "context": "ENVNT / Wevioo · Saudi Arabia"}'::jsonb, 1, true),
            (sec_cont, 'contribution_content', '{"items": ["Designed and refined service interfaces.", "Worked within existing product and design constraints.", "Created responsive UI patterns for low-code implementation.", "Collaborated with delivery teams to iterate on the experience."]}'::jsonb, 1, true),
            (sec_cont, 'process', '{"steps": [{"number": "01", "title": "Frame", "description": "Clarify the problem, users and constraints."}, {"number": "02", "title": "Structure", "description": "Turn requirements into flows and product logic."}, {"number": "03", "title": "Design", "description": "Create clear, reusable and implementation-ready UI."}, {"number": "04", "title": "Build", "description": "Connect the design to technology and iterate."}]}'::jsonb, 2, true),
            (sec_evid, 'image', '{"alt": "approved Saudi regulatory or healthcare service interface screenshot, anonymized for public portfolio"}'::jsonb, 1, true),
            (sec_tech, 'technology_tags', '{"tags": ["Figma", "OutSystems", "UX/UI", "Responsive Design", "Design Systems"]}'::jsonb, 1, true);
    END IF;

END $$;
