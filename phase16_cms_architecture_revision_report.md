# Phase 16 — CMS Architecture Revision & Builder Enhancement Report

## 1. Executive Summary

Phase 16 performed an end-to-end architecture audit and controlled enhancement of the portfolio's CMS infrastructure, specifically focusing on **Case Study CMS**, **Page Builder**, and their integration with the **Supabase Content Registry**.

The primary objective was to answer four architectural questions before any expansion (such as Blog):
1. **Where is content stored currently?**
   - Case Studies are stored authoritatively in `content_registry.metadata.caseStudy` (Supabase).
   - Pages are stored in the relational `pages` and `page_sections` tables (Supabase).
2. **Who is the source of truth?**
   - For `/work/:slug`: `content_registry` is the single source of truth.
   - For `/p/:slug` and `/about`: `pages` & `page_sections` (bridged to `content_registry` where `content_type = 'page'`).
3. **How do Page Builder and Case Study CMS interact with Content Registry?**
   - Content Registry provides identity (`id`, `slug`, `title`, `content_type`), publication status (`published`/`draft`), visibility (`public`/`private`), and routing (`public_route`).
   - Case Study CMS acts as a **specialized semantic editor** (`Hero`, `Challenge`, `Contribution`, `Evidence`, `Technology`) editing `metadata.caseStudy`.
   - Page Builder acts as a **composable section editor** (`Hero`, `Rich Text`, `Image`, `Quote`, `Spacer`, etc.) editing ordered sections.
4. **What shared infrastructure can be used between them?**
   - Route resolution (`contentRouteResolver.js`), registry health/readiness checks (`registryHealth.js`), image asset resolution (`assetRegistry.js`), unsaved change (`beforeunload`) guards, section movement/duplication logic, accessibility checks (alt text alerts), and publication lifecycle gates.

Crucially:
- No generic abstractions were prematurely forced onto the Case Study CMS.
- Case Study CMS retained its specialized semantic model, but was augmented with non-destructive section ordering, visibility toggling, step reordering, and duplication.
- Page Builder was upgraded with a centralized **Section Type Registry** (`PAGE_SECTION_TYPES`), structured validation, alt-text warnings, section duplication, and safety warnings.
- The duplicate source of truth between `/admin/case-studies` (legacy `case_studies` table) and `/admin/registry/:id` was eliminated by unifying the admin views over `content_registry`.
- The production build compiled with 0 errors (`npm run build`).
- **No deployment was performed.**

---

## 2. Current Architecture Audit

Prior to making changes, a thorough inspection of the database and code was conducted:

### Database Inspection
Using direct queries against Supabase:
- `content_registry`: 9 rows (all 9 case studies: `winni`, `assestini`, `cha9a9a`, `naim-copilot`, `career-os`, `saudi-government`, `saudi-banking`, `dga`, `saudi-regulatory`). All entries have `metadata.caseStudy` populated.
- `pages`: 1 row (`about`, `id: 85a864d4-5390-48e2-b072-db3d89ddab8f`, `slug: 'about'`).
- `page_sections`: 5 rows belonging to the `about` page (`hero`, `rich_text`, `timeline`, `workflow`, `cta`).
- `case_studies`: 9 rows from legacy migrations (pre-Phase 13).
- `projects`: 11 rows from catalog migrations.

### Runtime vs CMS Routes
- `/work/:slug`: Rendered strictly through [CaseStudyRenderer.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/components/case-study/CaseStudyRenderer.jsx), which queries `content_registry`, normalizes metadata, and delegates to [StandardCaseStudy.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/components/case-study/StandardCaseStudy.jsx) or custom case studies.
- `/p/:slug`: Rendered through [PageRenderer.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/components/cms/PageRenderer.jsx), which fetches from `siteCms.js` (`pages` + `page_sections`).
- `/admin/registry`: Master Content Registry dashboard.
- `/admin/registry/:id`: Deep editor for individual registry items, hosting [CaseStudyContentEditor.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/components/cms/CaseStudyContentEditor.jsx).
- `/admin/pages`: Page Builder index.
- `/admin/pages/:id`: Composable Page Builder editor ([AdminPageEditor.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/pages/AdminPageEditor.jsx)).

---

## 3. Case Study CMS Audit

The Case Study CMS was established in Phases 14 & 15:
- It edits `metadata.caseStudy` on `content_registry`.
- It maintains the structured semantic blocks:
  ```text
  Hero (title, lead, eyebrow, metaChips, image, alt, caption)
  Challenge (title, eyebrow, copy, role, context)
  Contribution (title, eyebrow, items[], process[])
  Evidence (title, eyebrow, image, alt, caption)
  Technology (title, eyebrow, tags[])
  ```
- **Identified Deficiencies**:
  - Subsections were strictly fixed in position; an author could not reorder Challenge or Contribution, nor temporarily hide a section without deleting its text.
  - Items in lists (Contribution bullets and Process steps) could not be reordered or duplicated easily.
  - While `/admin/registry/:id` edited `content_registry`, the sidebar link `/admin/case-studies` still loaded from the legacy `case_studies` table via `src/services/caseStudies.js`.

---

## 4. Page Builder Audit

The Page Builder was previously operating in a partial silo:
- It relied on `siteCms.js` interacting with `pages` and `page_sections`.
- Section schemas were defined loosely in `src/components/cms/sectionSchemas.js`.
- Several section types lacked dedicated property editors in `SectionPropertyEditor.jsx` (e.g., `image`, `quote`, `spacer`, `metrics`, `timeline`, `workflow`).
- `contentRouteResolver.js` lacked registered public route support for `page` (`implemented: false`), causing discrepancies in route validation.
- Section duplication was missing, and leaving with unsaved changes had no protection.

---

## 5. Content Registry Relationship

The Content Registry is the canonical authority across the entire portfolio:
```text
                          Content Registry
                       (Supabase content_registry)
                                    │
               ┌────────────────────┴────────────────────┐
               │                                         │
        content_type = 'case-study'               content_type = 'page'
               │                                         │
               ▼                                         ▼
      Case Study CMS Editor                     Composable Page Builder
   (/admin/registry/:id)                         (/admin/pages/:id)
               │                                         │
               ▼                                         ▼
      metadata.caseStudy                          metadata.page OR
               │                              page_sections (bridged)
               ▼                                         ▼
       CaseStudyRenderer                            PageRenderer
         (/work/:slug)                               (/p/:slug)
```

Content Registry strictly owns:
- Canonical identity (`id`, `slug`, `title`)
- Lifecycle status (`draft`, `published`, `archived`)
- Access visibility (`public`, `private`, `unlisted`)
- Canonical routing (`public_route`, resolved by `contentRouteResolver.js`)
- Publishing readiness and validation boundary

---

## 6. Source-of-Truth Analysis

| System | Pre-Phase 16 Source | Runtime Path | Phase 16 Target Status |
|---|---|---|---|
| **Case Study** | Split: `content_registry` at `/admin/registry/:id` vs `case_studies` table at `/admin/case-studies` | `content_registry` (`/work/:slug`) | **Unified single source of truth**: `content_registry`. `/admin/case-studies` now views and routes directly to Content Registry entries. |
| **Page Builder** | `pages` & `page_sections` tables | `pages` & `page_sections` (`/p/:slug` & `/about`) | **Bridged**: Registered `page` as an active content type in `contentRouteResolver.js` (`/p/:slug`, `implemented: true`) and normalized `metadata.page`. Tables preserved for zero downtime. |
| **Generic Pages** | Hardcoded React routes + `pages` table | Direct route matching in `App.jsx` + dynamic `/p/:slug` | Static routes preserved; composable dynamic pages routed via `/p/:slug`. |

---

## 7. Changes Implemented

### A. Case Study CMS Unification & Enhancement
1. **Unification of Admin Case Studies**:
   - Refactored [AdminCaseStudies.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/pages/AdminCaseStudies.jsx) to query `content_registry` where `contentType = 'case-study'`. "Edit" now directly routes to `/admin/registry/:id`.
   - Updated [AdminCaseStudyEditor.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/pages/AdminCaseStudyEditor.jsx) with an advisory warning and direct deep link to the authoritative Content Registry editor.
2. **Dynamic Section Visibility & Ordering**:
   - Updated [StandardCaseStudy.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/components/case-study/StandardCaseStudy.jsx) to respect `is_visible !== false` for each subsection and respect custom `sectionOrder` (defaulting safely to `['challenge', 'contribution', 'evidence', 'technology']`).
   - Enhanced [CaseStudyContentEditor.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/components/cms/CaseStudyContentEditor.jsx):
     - Added Move Up / Move Down buttons for Challenge, Contribution, Evidence, and Technology.
     - Added Visibility toggle (eye/eye-slash) for all subsections.
     - Added Move Up, Move Down, Duplicate, and Remove for Contribution bullet items.
     - Added Move Up, Move Down, Duplicate, and Remove for Process steps.
   - Preserved `sectionOrder` in [caseStudyRegistryMigration.js](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/services/caseStudyRegistryMigration.js) `normalizeCaseStudyContent()`.

### B. Page Builder Architecture & Section Registry
1. **Centralized Section Type Registry**:
   - Rewrote [sectionSchemas.js](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/components/cms/sectionSchemas.js) to establish `PAGE_SECTION_TYPES` defining `type`, `label`, `category`, `icon`, `description`, `defaultConfig`, and `validate(cfg)` for:
     - `hero`, `cta`, `project_grid`, `agent_grid`, `rich_text`, `image`, `quote`, `metrics`, `timeline`, `workflow`, `spacer`.
   - Provided backward-compatible `SECTION_SCHEMAS = PAGE_SECTION_TYPES`.
   - Added `getCategorizedSectionTypes()` and `validateSection(type, config)`.
2. **Page Builder Editor Enhancement**:
   - Enhanced [AdminPageEditor.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/pages/AdminPageEditor.jsx):
     - Added `beforeunload` unsaved changes browser prompt.
     - Added section duplication action (`handleDuplicateSection`).
   - Enhanced [SectionPropertyEditor.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/components/cms/editors/SectionPropertyEditor.jsx):
     - Added dedicated property editors for `image` (with alt-text warning), `quote`, `spacer`, `metrics`, `timeline`, and `workflow`.
     - Integrated live validation banners displaying error and advisory feedback per section.
   - Refactored [AddSectionModal.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/components/cms/AddSectionModal.jsx) to dynamically derive available section templates from `getCategorizedSectionTypes()`.

### C. Content Registry Route & Type Expansion
1. **Route Resolution for Pages**:
   - Updated [contentRouteResolver.js](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/services/contentRouteResolver.js):
     - Configured `page` route: `basePath: '/p'`, `implemented: true`.
2. **Registry UI Updates**:
   - Added `page` to `CONTENT_TYPES` in [AdminRegistryEntry.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/pages/AdminRegistryEntry.jsx) and [RegistryFormModal.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/components/cms/RegistryFormModal.jsx).
   - Added `page` to filter options and labels in [AdminRegistry.jsx](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/admin/pages/AdminRegistry.jsx).
   - Updated `normalizeRegistryEntry` in [contentRegistry.js](file:///c:/Users/aii/.gemini/antigravity-ide/scratch/naim-portfolio-mvp/src/services/contentRegistry.js) to normalize `page: meta.page || null`.

---

## 8. Shared Infrastructure

Functionality extracted and shared across both editors:
- **Route Resolution & Safety**: Centralized in `contentRouteResolver.js` (`getCanonicalRoute`, `getContentTypeRoute`, `isPublicRouteImplemented`).
- **Asset Resolution**: Shared across editors via `assetRegistry.js` (`resolveAsset`).
- **Accessibility Verification**: Alt-text presence checks standardized across both `CaseStudyContentEditor` and Page Builder's `SectionPropertyEditor`.
- **Validation**: Schema-level validation pipelines returning `{ valid, errors, advisories }`.
- **Navigation Safety**: `beforeunload` listeners in both `AdminRegistryEntry` and `AdminPageEditor`.
- **List/Section Manipulation Patterns**: Standardized item cloning, reordering, and duplication paradigms.

---

## 9. Data Schema

### 1. Case Study Schema (`metadata.caseStudy`)
```json
{
  "version": 1,
  "type": "standard",
  "sectionOrder": ["hero", "challenge", "contribution", "evidence", "technology"],
  "hero": {
    "eyebrow": "AI AGENT · N8N · RAG",
    "title": "Case Study Title",
    "lead": "Executive summary...",
    "metaChips": ["Lead Designer · 2026"],
    "image": "cover-copilot-naim.png",
    "imageAlt": "Hero preview",
    "caption": "Production interface",
    "is_visible": true
  },
  "challenge": {
    "eyebrow": "THE CHALLENGE",
    "title": "Core Problem",
    "copy": "Detailed narrative...",
    "role": "Product Designer",
    "context": "Enterprise client",
    "is_visible": true
  },
  "contribution": {
    "eyebrow": "MY CONTRIBUTION",
    "title": "From concept to implementation",
    "items": ["Achievement 1", "Achievement 2"],
    "process": [
      { "step": "01", "title": "Discovery", "desc": "Process narrative..." }
    ],
    "is_visible": true
  },
  "evidence": {
    "eyebrow": "DELIVERABLES",
    "title": "Production Artifacts",
    "image": "The-work-behind-the-interface.png",
    "imageAlt": "Artifacts screenshot",
    "caption": "Verified responsive",
    "is_visible": true
  },
  "technology": {
    "eyebrow": "TOOLING & STACK",
    "title": "Technologies leveraged",
    "tags": ["Next.js", "TypeScript", "Tailwind"],
    "is_visible": true
  }
}
```

### 2. Page Section Schema (`page_sections` / `metadata.page.sections[]`)
```json
{
  "id": "sec-123",
  "section_type": "hero",
  "sort_order": 0,
  "is_visible": true,
  "config": {
    "headline": "Page Headline",
    "subheadline": "Supporting copy",
    "layout": "split",
    "primaryCta": { "label": "Get Started", "link": "/contact", "visible": true },
    "secondaryCta": { "label": "Learn More", "link": "/about", "visible": false }
  }
}
```

---

## 10. Public Runtime

The runtime flow strictly enforces Content Registry publication and validation gates:
```text
1. User requests URL (/work/:slug OR /p/:slug)
       ↓
2. Route matched in App.jsx
       ↓
3. Content fetched from Supabase:
   - For /work/:slug: getContentRegistryEntryBySlug(slug)
   - For /p/:slug: getPublishedPageBySlug(slug)
       ↓
4. Publication & Visibility Gate:
   - status === 'published'
   - visibility === 'public'
   (If gate fails -> 404 RegistryNotFoundState)
       ↓
5. Normalization Boundary:
   - normalizeRegistryEntry(raw)
       ↓
6. Renderer Component:
   - CaseStudyRenderer -> StandardCaseStudy / CustomComponent
   - PageRenderer -> SectionRenderer (hero, rich_text, etc.)
       ↓
7. Clean Public DOM Presentation
```

---

## 11. Backward Compatibility

All existing content and routes were verified for 100% backward compatibility:
- **Case Studies**: All 9 case studies (`winni`, `assestini`, `cha9a9a`, `naim-copilot`, `career-os`, `saudi-government`, `saudi-banking`, `dga`, `saudi-regulatory`) load their existing v1 schema without error.
- **Default Section Order**: If `sectionOrder` is absent in older records, `StandardCaseStudy` falls back automatically to `['challenge', 'contribution', 'evidence', 'technology']`.
- **Default Section Visibility**: If `is_visible` is undefined, sections remain visible (`is_visible !== false`).
- **Page Builder Sections**: The `SECTION_SCHEMAS` constant remains exported as an alias of `PAGE_SECTION_TYPES`. Existing `about` page sections render without modification.

---

## 12. Security

- **No Service-Role Key**: All frontend and admin operations use the client Supabase key under existing RLS policies.
- **Publication Gate**: Unauthenticated users cannot view draft or private entries.
- **Safe Route Resolution**: Slugs and routes are sanitized by `normalizeSlug()`.
- **XSS & Injection Protection**: HTML tags in rich text sections are rendered via controlled React elements or sanitized markup.

---

## 13. Tests

### Automated Test Script (`scratch/test_phase16_verification.mjs`)
- Tested `PAGE_SECTION_TYPES` and categories definition (11 types registered).
- Tested section validation logic (`validHero`, `invalidHero`, and image alt-text advisory).
- Tested `getCanonicalRoute` and `isPublicRouteImplemented` for both `page` and `case-study`.
- Tested `normalizeRegistryEntry` for both page metadata and case study metadata with custom `sectionOrder`.
- **Result**: `=== ALL AUTOMATED ARCHITECTURAL CHECKS PASSED ===` (Exit code 0).

### Build Verification
- Ran `npm run build`.
- **Result**: `✓ built in 8.83s` with 0 compilation errors (Exit code 0).

---

## 14. Build

```text
> naim-portfolio@0.1.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 313 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                           1.53 kB │ gzip:   0.66 kB
dist/assets/index-CMCj_FrL.css           69.03 kB │ gzip:  13.53 kB
dist/assets/index-CQlQ7Jbv.js         1,180.79 kB │ gzip: 295.77 kB
✓ built in 8.83s
```

---

## 15. Deferred Work

The following items are intentionally deferred to future phases:
- **Blog Content Type**: No public blog routes or runtime components were introduced.
- **Supabase Storage Integration**: Asset references continue to use `assetRegistry.js` without S3/storage buckets.
- **Authenticated Draft Preview Token**: Previews currently rely on admin state and route simulation.
- **Collaborative Editing / Autosave**: No websockets or concurrent locking introduced.
- **Deep Historical Versioning**: Entries maintain current state and version tag without multi-snapshot diffing.

---

## 16. Deployment

NO DEPLOYMENT PERFORMED.
