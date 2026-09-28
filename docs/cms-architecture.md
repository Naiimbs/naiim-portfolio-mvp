# Supabase CMS & Data Architecture

## 1. Overview
The Naïm Bsili portfolio CMS architecture utilizes **Supabase (PostgreSQL + Auth + Storage + RLS)** to manage portfolio projects, case studies, structured section blocks, media assets, and admin authentication, while keeping visual presentation in React.

```text
React Front-End (Vite / React 18)
      │
      ▼
Public Case Study Router (/work/:slug)
      │
      ├── If slug in ('winni', 'assestini') ──► Custom React Renderer (Code-Driven)
      │
      └── Standard Case Studies
            │
            ▼
      Data Layer (src/services/caseStudies.js)
            │
            ├─► Published CMS Case Study in Supabase ──► CMSCaseStudyRenderer (CMS Source of Truth)
            │                                              │
            │                                              ├── CMSSectionRenderer
            │                                              └── Block Registry (TextBlock, ImageBlock...)
            │
            └─► Local Snapshot Fallback ──────────────► StandardCaseStudy (Fallback Safety Net)
```

---

## 2. Source of Truth & Safe Migration Model

### Principle
1. **CMS Source of Truth**: For standard case studies (`cha9a9a`, `naim-copilot`, `career-os`, `saudi-government`, `saudi-banking`, `saudi-regulatory`, `dga`), Supabase CMS is the definitive source of truth for all content, section order, and media references.
2. **Local Fallback Safety Net**: Static data in `src/data/caseStudies.js` is preserved as a permanent safety net when Supabase is offline or unconfigured.
3. **No Unwanted Overwrite**: If CMS content exists in Supabase, the public site and admin editor **always** consume and display the CMS data. Local fallback data is never allowed to overwrite existing CMS records.

---

## 3. Database Schema

### Table: `projects`
Portfolio-level catalog representation of work:
* `id` (UUID, Primary Key)
* `slug` (TEXT, Unique, Indexed)
* `title` (TEXT)
* `kicker` (TEXT)
* `short_description` (TEXT)
* `category` (TEXT)
* `year` (INTEGER)
* `roles` (TEXT[])
* `tools` (TEXT[])
* `thumbnail_media_id` (UUID, Foreign Key -> `media.id`)
* `is_featured` (BOOLEAN, Indexed)
* `sort_order` (INTEGER, Indexed)
* `status` (ENUM: `draft`, `published`, `archived`)
* `created_at`, `updated_at` (TIMESTAMPTZ)

### Table: `case_studies`
Case study document metadata and SEO:
* `id` (UUID, Primary Key)
* `project_id` (UUID, Unique, Foreign Key -> `projects.id`)
* `type` (ENUM: `standard`, `custom`)
* `title` (TEXT)
* `subtitle` (TEXT)
* `hero_media_id` (UUID, Foreign Key -> `media.id`)
* `seo_title`, `seo_description`, `canonical_path` (TEXT)
* `status` (ENUM: `draft`, `published`, `archived`)
* `created_at`, `updated_at` (TIMESTAMPTZ)

### Table: `case_study_sections`
Logical order and grouping of sections within a case study:
* `id` (UUID, Primary Key)
* `case_study_id` (UUID, Foreign Key -> `case_studies.id`)
* `section_type` (TEXT, e.g. `hero`, `content`, `problem`, `challenge`, `process`, `gallery`, `quote`, `metrics`, `technology`, `cta`)
* `title`, `eyebrow` (TEXT)
* `order_index` (INTEGER, Indexed)
* `is_visible` (BOOLEAN)
* `created_at`, `updated_at` (TIMESTAMPTZ)

### Table: `section_blocks`
Modular block payload per section:
* `id` (UUID, Primary Key)
* `section_id` (UUID, Foreign Key -> `case_study_sections.id`)
* `block_type` (TEXT, e.g. `text`, `image`, `gallery`, `quote`, `metrics`, `process`, `tech_stack`, `cta`, `spacer`)
* `content` (JSONB)
* `order_index` (INTEGER)
* `is_visible` (BOOLEAN)
* `created_at`, `updated_at` (TIMESTAMPTZ)

### Table: `media`
Asset metadata for Supabase Storage objects:
* `id` (UUID, Primary Key)
* `storage_path` (TEXT)
* `public_url` (TEXT)
* `filename` (TEXT)
* `alt_text`, `caption`, `mime_type` (TEXT)
* `width`, `height` (INTEGER)
* `size_bytes` (BIGINT)
* `created_at` (TIMESTAMPTZ)

### Table: `profiles`
Role-based access control for administrative users:
* `id` (UUID, Primary Key -> `auth.users.id`)
* `email` (TEXT)
* `full_name` (TEXT)
* `role` (ENUM: `admin`, `editor`, `viewer`)

---

## 4. Media Architecture & Supabase Storage

### Bucket & Storage Path
- **Bucket**: `portfolio-media` (Public read enabled)
- **Path Format**: `case-studies/{timestamp}_{sanitized_filename}` or `projects/{timestamp}_{sanitized_filename}`
- **Collision Safety**: Names are sanitized and prefixed with Unix timestamps to prevent accidental overwrites.

### Supported Formats & Constraints
- Supported: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`, `image/gif`
- Maximum file size: **10 MB**
- Auto-extraction of pixel dimensions (`width`, `height`) during browser upload.

### Media Picker (`MediaPickerModal.jsx`)
- Integrated into `BlockEditorModal.jsx` for both `ImageBlock` (single asset selection) and `GalleryBlock` (multiple asset selection).
- Provides live thumbnail previews, search filtering, quick file upload, and direct URL fallback.

---

## 5. Public CMS Renderer Architecture

### 1. `CMSCaseStudyRenderer.jsx`
- Reuses the public portfolio design system (`src/styles/style.css`).
- Injects dynamic `SEO` metadata (title, description, canonical link, and OpenGraph/Schema.org JSON-LD).
- Renders `.case-hero` with kicker, title, lead copy, meta chips (roles, tools, year), and hero imagery.
- Iterates over all visible sections and maps them through `CMSSectionRenderer.jsx`.
- Renders the public footer navigation strip (`.case-nav`).

### 2. `CMSSectionRenderer.jsx`
- Evaluates `is_visible !== false`.
- Applies `.case-section` and `.case-section.alt` styling.
- Renders section eyebrow badge and section heading.
- Dynamically renders blocks through the `blockRegistry`.

### 3. Block Registry (`src/components/case-study/blocks/`)
- `TextBlock`: Paragraphs, headings, and bulleted lists.
- `ImageBlock`: `<figure>` with `<img>`, `<figcaption>`, and fallback placeholder.
- `GalleryBlock`: Responsive 2/3 column image comparison grid with caption.
- `QuoteBlock`: Pull quote card with author and role attribution.
- `MetricsBlock`: KPI card grid with Space Grotesk statistics.
- `ProcessBlock`: Numbered `.case-process` workflow steps.
- `TechStackBlock`: Categorized `.tech-row` technology badges.
- `CTABlock`: Action card with link button.
- `SpacerBlock`: Semantic vertical divider (`small`, `medium`, `large`).
- `UnsupportedBlock`: Safe fallback component preventing runtime errors.

---

## 6. Custom vs Standard Case Studies

| Case Study | Route | Renderer | CMS Role |
| :--- | :--- | :--- | :--- |
| **WINNI** | `/work/winni` | `WinniCaseStudy.jsx` (Custom React) | Metadata, SEO, Status |
| **Assestini** | `/work/assestini` | `AssestiniCaseStudy.jsx` (Custom React) | Metadata, SEO, Status |
| **Cha9a9a** | `/work/cha9a9a` | `CMSCaseStudyRenderer.jsx` | Full CMS sections & blocks |
| **Naïm Copilot** | `/work/naim-copilot` | `CMSCaseStudyRenderer.jsx` | Full CMS sections & blocks |
| **Career OS** | `/work/career-os` | `CMSCaseStudyRenderer.jsx` | Full CMS sections & blocks |
| **Saudi Government** | `/work/saudi-government` | `CMSCaseStudyRenderer.jsx` | Full CMS sections & blocks |
| **Saudi Banking** | `/work/saudi-banking` | `CMSCaseStudyRenderer.jsx` | Full CMS sections & blocks |
| **Saudi Regulatory** | `/work/saudi-regulatory` | `CMSCaseStudyRenderer.jsx` | Full CMS sections & blocks |
| **DGA** | `/work/dga` | `CMSCaseStudyRenderer.jsx` | Full CMS sections & blocks |

---

## 7. Security & Publication Behavior
- **Public Users**:
  - Read access strictly enforced via RLS (`status = 'published'` AND `is_visible = true`).
  - Drafts and hidden sections/blocks are inaccessible to anonymous users.
- **Admin / Editor Users**:
  - Full CRUD permissions via `profiles.role IN ('admin', 'editor')`.
  - Can draft, preview, reorder, edit, and publish content.
