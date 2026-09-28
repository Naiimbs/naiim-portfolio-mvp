# Supabase CMS & Data Architecture

## 1. Overview
The Naïm Bsili portfolio CMS architecture utilizes **Supabase (PostgreSQL + Auth + Storage + RLS)** to manage portfolio projects, case studies, structured section blocks, media assets, and admin authentication, while keeping visual presentation in React.

```text
React Front-End (Vite / React 18)
      │
      ▼
Data Services Layer (src/services/projects.js, caseStudies.js)
      │
      ├───────────────────────────────┐
      │ (If configured & online)      │ (If unconfigured or offline)
      ▼                               ▼
Supabase Client (src/lib/supabase.js) Local Static Data (src/data/)
      │                               (Fallback Safety Net)
      ▼
PostgreSQL / Storage / Auth (RLS Protected)
```

---

## 2. Database Schema

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
* `section_type` (TEXT, e.g. `hero`, `challenge`, `process`, `gallery`, `quote`, `metrics`, `technology`, `cta`)
* `title`, `eyebrow` (TEXT)
* `order_index` (INTEGER, Indexed)
* `is_visible` (BOOLEAN)
* `created_at`, `updated_at` (TIMESTAMPTZ)

### Table: `section_blocks`
Flexible modular payload per section:
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

### Table: `profiles`
Role-based access control for administrative users:
* `id` (UUID, Primary Key -> `auth.users.id`)
* `email` (TEXT)
* `full_name` (TEXT)
* `role` (ENUM: `admin`, `editor`, `viewer`)

---

## 3. Storage Strategy
* **Bucket**: `portfolio-media` (Public read for published content)
* **Folder Hierarchy**:
  - `projects/` — Thumbnails and hero assets
  - `case-studies/` — Detailed evidence and flow diagrams
  - `plugins/` — Figma plugin covers and iconography

---

## 4. Row Level Security (RLS) Policies
* **Anonymous / Public User**:
  - `SELECT` only on rows where `status = 'published'` and `is_visible = true`.
  - Zero write permissions (`INSERT`, `UPDATE`, `DELETE` are denied).
* **Admin / Editor User** (`is_admin()` helper or `role IN ('admin', 'editor')`):
  - Full CRUD permissions on all tables and draft records.

---

## 5. Local Fallback Strategy
To guarantee 100% build stability and zero downtime during local development or offline states:
1. `src/lib/supabase.js` checks for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. If absent or network requests fail, `src/services/projects.js` and `src/services/caseStudies.js` automatically serve the local snapshot from `src/data/`.
3. The fallback service seamlessly maps all existing static case studies (e.g. `cha9a9a`, `naim-copilot`, `career-os`, etc.) into structured sections and blocks so the Visual Editor is immediately populated with realistic content.

---

## 6. Visual Case Study Editor (Phase 13A)

### Overview
Located at `/admin/case-studies/:id`, the Visual Case Study Editor provides a visual workspace for managing the real sections and content blocks of case studies.

### Architecture
- **Workspace View** (`AdminCaseStudyEditor.jsx`):
  - Case study header: Title, Subtitle, Type badge, Dirty state indicator, `[Preview]`, `[Save Draft]`, `[Publish]`.
  - Case Study Settings & SEO card (`title`, `subtitle`, `seo_title`, `seo_description`, `canonical_path`, `status`).
  - Section Overview list (`SectionList.jsx`).
  - `+ Add Section` modal (`AddSectionModal.jsx`).
- **Section Drawer / Side Panel** (`SectionDrawer.jsx`):
  - Slide-out panel to edit section metadata (`section_type`, `eyebrow`, `title`, `is_visible`).
  - Reorderable list of content blocks with summaries and action controls.
  - `+ Add Block` selector modal (`AddBlockModal.jsx`).
  - Block field schema editor (`BlockEditorModal.jsx`).

### Standard vs Custom Case Studies
1. **Custom React Case Studies (`WINNI`, `Assestini`)**:
   - Flagged with `type = 'custom'`.
   - The editor renders a dedicated notice explaining that complex interactive visualizations and simulation states are maintained in code (`src/pages/custom-case-studies/`).
   - Editors can update top-level title, subtitle, SEO metadata, canonical path, and publication status.
2. **Standard Case Studies (`Cha9a9a`, `Naïm Copilot`, `Career OS`, `Saudi Government`, `Saudi Banking`, `Saudi Regulatory`, `DGA`)**:
   - Flagged with `type = 'standard'`.
   - Full section & block visual editing, reordering, creation, and deletion.

### Supported Block Types & JSONB Schemas
1. **`TextBlock`** (`block_type: 'text'`):
   - `heading`: string
   - `body`: multiline string / markdown
2. **`ImageBlock`** (`block_type: 'image'`):
   - `media_url` / `media_id`: string
   - `alt`: string
   - `caption`: string
3. **`GalleryBlock`** (`block_type: 'gallery'`):
   - `media`: array of image objects
   - `caption`: string
4. **`QuoteBlock`** (`block_type: 'quote'`):
   - `quote`: string
   - `author`: string
   - `role`: string
5. **`MetricsBlock`** (`block_type: 'metrics'`):
   - `items`: array of `{ value, label, description }`
6. **`ProcessBlock`** (`block_type: 'process'`):
   - `steps`: array of `{ number, title, description }`
7. **`TechStackBlock`** (`block_type: 'tech_stack'`):
   - `items`: array of `{ name, category }`
8. **`CTABlock`** (`block_type: 'cta'`):
   - `title`, `description`, `label`, `url`
9. **`SpacerBlock`** (`block_type: 'spacer'`):
   - `size`: `'small'` | `'medium'` | `'large'`

### Drag & Drop & Order Persistence
- **Lightweight HTML5 Drag & Drop**: Implemented natively on sections and blocks with zero heavy third-party dependencies.
- **Accessibility**: Every item includes explicit `Move Up` / `Move Down` buttons for full keyboard navigation and touch support.
- **Controlled Save**: Reordering updates local state immediately; `order_index` is normalized (`1, 2, 3...`) and persisted to PostgreSQL sequentially when clicking `Save Draft` or `Publish`.

### Current Limitations & Next Phase
- **Media Uploads (Phase 13B)**: Currently, `ImageBlock` and `GalleryBlock` accept asset paths/URLs. Direct drag-and-drop file upload to the Supabase `portfolio-media` storage bucket will be implemented in Phase 13B.
