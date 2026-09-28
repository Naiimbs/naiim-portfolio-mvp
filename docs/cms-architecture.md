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
* `section_type` (TEXT, e.g. `hero`, `challenge`, `workflow`, `evidence`, `technology`)
* `title`, `eyebrow` (TEXT)
* `order_index` (INTEGER, Indexed)
* `is_visible` (BOOLEAN)
* `created_at`, `updated_at` (TIMESTAMPTZ)

### Table: `section_blocks`
Flexible modular payload per section:
* `id` (UUID, Primary Key)
* `section_id` (UUID, Foreign Key -> `case_study_sections.id`)
* `block_type` (TEXT)
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
* **Admin User** (`is_admin()` helper based on `profiles.role = 'admin'`):
  - Full CRUD permissions on all tables and draft records.

---

## 5. Local Fallback Strategy
To guarantee 100% build stability and zero downtime during local development or offline states:
1. `src/lib/supabase.js` checks for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. If absent or network requests fail, `src/services/projects.js` and `src/services/caseStudies.js` automatically serve the local snapshot from `src/data/`.

---

## 6. Admin CMS Foundation (Phase 12)
* **Protected Routes**:
  - `/admin/login` — Supabase password-based authentication.
  - `/admin` — High-level project, draft, case study & media stats dashboard.
  - `/admin/projects` — Catalog table with status filters and edit links.
  - `/admin/projects/:id` — Metadata editor form for projects.
  - `/admin/case-studies` — Overview of custom React vs standard CMS case studies.
  - `/admin/media` — Indexed storage media asset table.
* **Authentication Flow**:
  - `AuthProvider` monitors session state via `supabase.auth.onAuthStateChange()`.
  - `AdminGuard` validates presence of authenticated session and checks `profiles.role IN ('admin', 'editor')`.
  - Unauthenticated visits to `/admin/*` redirect immediately to `/admin/login`.
* **Security Boundaries**:
  - Frontend guard prevents UI exposure, while PostgreSQL RLS remains the authoritative security boundary.
  - All admin routes inject `<meta name="robots" content="noindex, nofollow" />`.
* **Deferred to Phase 13**:
  - Drag-and-drop block builder, rich text editor, batch media file uploads, and blog management.
