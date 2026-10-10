-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 013_resources_system.sql
-- Description:
--   1. Update chk_registry_content_type to allow 'resource' in content_registry.
--   2. Seed first-class reference resource 'app-ui-ux-auditor' with full rich metadata and assets.
-- Backward-compatible, additive, idempotent.
-- ==============================================================================

-- 1. Allow 'resource' in content_registry
ALTER TABLE public.content_registry DROP CONSTRAINT IF EXISTS chk_registry_content_type;
ALTER TABLE public.content_registry ADD CONSTRAINT chk_registry_content_type CHECK (
    content_type IN ('case-study', 'agent', 'plugin', 'blog', 'page', 'resource', 'other')
);

-- 2. Upsert first-class reference Resource
INSERT INTO public.content_registry (
    id,
    title,
    slug,
    content_type,
    status,
    visibility,
    featured,
    sort_order,
    public_route,
    metadata
)
VALUES (
    'a71e8081-3c58-4509-9061-0dfae169542a',
    'App UI/UX & Responsive Design QA Auditor',
    'app-ui-ux-auditor',
    'resource',
    'published',
    'public',
    true,
    10,
    '/resources/app-ui-ux-auditor',
    jsonb_build_object(
        'resource_type', 'skill',
        'short_description', 'Autonomous QA agent skill for auditing enterprise web applications, testing multi-breakpoint responsive collapses, and generating publication-grade PDF and Excel deliverables.',
        'description', 'A battle-tested autonomous Agent Skill designed for Antigravity and compatible AI coding assistants. It executes comprehensive functional, workflow, UX heuristic, and responsive design audits across Desktop (1440px), Laptop (1024px), Tablet (768px), and Mobile (390px) viewports with zero manual screenshot pasting.',
        'version', '1.0.0',
        'author', 'Naïm Bsili',
        'license', 'MIT',
        'purpose', 'Automate enterprise application UI/UX audits, detect hidden responsive collapses, and generate client-ready PDF and Excel QA reports with real visual screenshot evidence.',
        'when_to_use', jsonb_build_array(
            'Auditing enterprise SaaS platforms, CMS portals, or client web applications.',
            'Verifying multi-device responsive behavior (Desktop 1440px, Tablet 768px, Mobile 390px).',
            'Detecting layout clipping, sticky footer occlusion, and naked-icon bottom navigation.',
            'Generating publication-grade PDF reports and Excel workbooks with embedded screenshot thumbnails.',
            'Checking bilingual Arabic/English RTL alignment and input usability.'
        ),
        'when_not_to_use', jsonb_build_array(
            'Auditing native mobile apps (iOS/Android native binaries).',
            'Backend performance load testing or SQL stress testing.',
            'Rebranding corporate visual identity or logos (brand design remains a fixed constraint).'
        ),
        'how_to_use', '### Step 1: Triggering the Audit
Provide Antigravity with a URL and define the desired scope:
```text
Audit https://cms-unifyapps-dev.modhs.med.sa for both UI and UX with PDF and Excel export.
```

### Step 2: Autonomous Execution Pipeline
1. **Live Browser Exploration:** Progressively maps navigation, tables, forms, and drawers.
2. **Multi-Viewport Captures:** Takes real screenshots at 1440×900, 1024×768, 768×1024, and 390×844.
3. **Heuristic Evaluation:** Evaluates cognitive load, filter degradation, touch targets (≥44px), and Arabic RTL.
4. **Deliverable Generation:** Compiles structured findings into a 10-page budgeted PDF and a 3-sheet Excel workbook (.xlsx).',
        'installation', '### 1. Global Skill (All Projects)
Copy the skill directory to your user configuration root:
```bash
cp -r app-ui-ux-auditor ~/.gemini/config/skills/app-ui-ux-auditor
```

### 2. Workspace Skill (Project Specific)
Place in your repository''s agents directory:
```bash
cp -r app-ui-ux-auditor .agents/skills/app-ui-ux-auditor
```

### 3. Version Control
Commit the folder to Git to share with pair-programming team members.',
        'compatibility', jsonb_build_array(
            jsonb_build_object('name', 'Google Antigravity', 'status', 'verified', 'notes', 'Full browser subagent and tool integration'),
            jsonb_build_object('name', 'Claude (Computer Use)', 'status', 'compatible', 'notes', 'Compatible with standard browser execution'),
            jsonb_build_object('name', 'OpenAI Swarm / Custom Agents', 'status', 'not_verified', 'notes', 'Requires markdown prompt parsing')
        ),
        'source_url', 'https://github.com/naiimbsili/antigravity-skills',
        'repository_url', 'https://github.com/naiimbsili/antigravity-skills/tree/main/skills/app-ui-ux-auditor',
        'bundle_download_url', '/resources/app-ui-ux-auditor/app-ui-ux-auditor.zip',
        'tags', jsonb_build_array('Agent Skill', 'UI/UX Audit', 'Responsive QA', 'Design Systems', 'Automation'),
        'assets', jsonb_build_array(
            jsonb_build_object(
                'id', 'asset-1',
                'name', 'SKILL.md',
                'asset_type', 'documentation',
                'file_url', '/resources/app-ui-ux-auditor/SKILL.md',
                'description', 'Core instructions, prompt triggers, YAML metadata, and heuristic rules.',
                'is_required', true,
                'is_previewable', true,
                'is_downloadable', true,
                'sort_order', 10,
                'file_size', '6.7 KB'
            ),
            jsonb_build_object(
                'id', 'asset-2',
                'name', 'README.md',
                'asset_type', 'documentation',
                'file_url', '/resources/app-ui-ux-auditor/README.md',
                'description', 'Complete user guide, copy-paste prompts, and deliverable specifications.',
                'is_required', false,
                'is_previewable', true,
                'is_downloadable', true,
                'sort_order', 20,
                'file_size', '3.4 KB'
            ),
            jsonb_build_object(
                'id', 'asset-3',
                'name', 'pdf_generator.py',
                'asset_type', 'script',
                'file_url', '/resources/app-ui-ux-auditor/scripts/pdf_generator.py',
                'description', 'Headless Chrome PDF generator with A4 page budgeting and anti-banner-split CSS.',
                'is_required', false,
                'is_previewable', true,
                'is_downloadable', true,
                'sort_order', 30,
                'file_size', '2.1 KB'
            ),
            jsonb_build_object(
                'id', 'asset-4',
                'name', 'excel_generator.py',
                'asset_type', 'script',
                'file_url', '/resources/app-ui-ux-auditor/scripts/excel_generator.py',
                'description', 'Python openpyxl automation script for generating multi-sheet workbooks with embedded screenshot thumbnails.',
                'is_required', false,
                'is_previewable', true,
                'is_downloadable', true,
                'sort_order', 40,
                'file_size', '2.5 KB'
            ),
            jsonb_build_object(
                'id', 'asset-5',
                'name', 'Audit Notes Template.xlsx',
                'asset_type', 'template',
                'file_url', '/resources/app-ui-ux-auditor/audit-notes-template.xlsx',
                'description', 'Blank, structured 3-sheet audit workbook for recording heuristic findings and embedding visual proof.',
                'is_required', false,
                'is_previewable', false,
                'is_downloadable', true,
                'sort_order', 50,
                'file_size', '292 KB'
            ),
            jsonb_build_object(
                'id', 'asset-6',
                'name', 'Example Audit Report.pdf',
                'asset_type', 'example',
                'file_url', '/resources/app-ui-ux-auditor/example-audit-report.pdf',
                'description', 'Real-world 10-page audit deliverable generated for CMS UnifyApps with embedded cross-device evidence.',
                'is_required', false,
                'is_previewable', false,
                'is_downloadable', true,
                'sort_order', 60,
                'file_size', '2.3 MB'
            ),
            jsonb_build_object(
                'id', 'asset-7',
                'name', 'Dashboard Desktop (1440×900)',
                'asset_type', 'screenshot',
                'file_url', '/resources/app-ui-ux-auditor/screenshots/dashboard-desktop-1440.png',
                'description', 'Widescreen overview layout baseline showing Recent Activity table.',
                'is_required', false,
                'is_previewable', true,
                'is_downloadable', true,
                'sort_order', 70,
                'file_size', '159 KB'
            ),
            jsonb_build_object(
                'id', 'asset-8',
                'name', 'Dashboard Mobile (390×844)',
                'asset_type', 'screenshot',
                'file_url', '/resources/app-ui-ux-auditor/screenshots/dashboard-mobile-390.png',
                'description', 'Mobile responsive breakdown showing severe KPI card collision and text truncation.',
                'is_required', false,
                'is_previewable', true,
                'is_downloadable', true,
                'sort_order', 80,
                'file_size', '71 KB'
            ),
            jsonb_build_object(
                'id', 'asset-9',
                'name', 'Media Center Grid Collapse (390×844)',
                'asset_type', 'screenshot',
                'file_url', '/resources/app-ui-ux-auditor/screenshots/media-mobile-390.png',
                'description', 'Mobile 4-column lock bug squeezing asset cards into 80px strips.',
                'is_required', false,
                'is_previewable', true,
                'is_downloadable', true,
                'sort_order', 90,
                'file_size', '151 KB'
            ),
            jsonb_build_object(
                'id', 'asset-10',
                'name', 'Drawer Form Sticky Footer Occlusion',
                'asset_type', 'screenshot',
                'file_url', '/resources/app-ui-ux-auditor/screenshots/add-page-drawer-form.png',
                'description', 'Modal drawer where bottom action buttons obscure lowest form input field.',
                'is_required', false,
                'is_previewable', true,
                'is_downloadable', true,
                'sort_order', 100,
                'file_size', '162 KB'
            ),
            jsonb_build_object(
                'id', 'asset-11',
                'name', 'app-ui-ux-auditor.zip',
                'asset_type', 'source',
                'file_url', '/resources/app-ui-ux-auditor/app-ui-ux-auditor.zip',
                'description', 'Complete offline skill bundle archive containing all markdown, scripts, templates, and screenshots.',
                'is_required', true,
                'is_previewable', false,
                'is_downloadable', true,
                'sort_order', 110,
                'file_size', '3.1 MB'
            )
        )
    )
)
ON CONFLICT (slug) DO UPDATE SET
    content_type = 'resource',
    public_route = '/resources/app-ui-ux-auditor',
    status = 'published',
    visibility = 'public',
    featured = true,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
