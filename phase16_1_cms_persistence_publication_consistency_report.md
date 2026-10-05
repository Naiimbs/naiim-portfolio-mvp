# Phase 16.1 — CMS Persistence, Publication & Registry Consistency Hardening Report

## 1. Executive Summary

Phase 16.1 hardened the CMS architecture established in Phase 16. It focused strictly on persistence correctness, single publication authority enforcement, and cross-system consistency between the **Supabase Content Registry**, the **Page Builder** (`pages` + `page_sections`), the **Case Study CMS** (`metadata.caseStudy`), and the **Public Renderers**.

Key achievements:
1. **Single Publication Authority**: Enforced across both Case Studies and Pages. A page or case study can never become public simply because a database row has `status = 'published'` if the authoritative Content Registry row has `status = 'draft'` or `visibility = 'private'`.
2. **Page Publication Consistency Matrix**: Verified all 5 states in the matrix (`draft + draft + private → NO`, `published + draft + private → NO`, `published + published + private → NO`, `draft + published + public → NO`, `published + published + public → YES`).
3. **Registry ↔ Page Synchronization**: Integrated `syncPageWithRegistry()` in `siteCms.js`, ensuring every page creation, update, draft save, and publish in the Page Builder synchronizes identity, status, visibility, and routing with `content_registry`.
4. **Publishing Readiness for Pages**: Built `getPagePublishingReadiness()` in `registryHealth.js`, checking required title, slug, and visible sections, and providing advisories for SEO and accessibility (alt-text warnings).
5. **Page Builder Save Draft & Publish Workflows**: Enhanced `AdminPageEditor.jsx` with distinct `Save Draft` (guarantees private draft state) and `Publish Page` (validates readiness and synchronizes live public state) workflows.
6. **Preview Authorization**: Protected `/p/:slug?preview=true` so only authenticated editors can preview drafts. Unauthenticated visits to draft routes are blocked with 404 / Page Not Found.
7. **Production Verification**: Automated test script `scratch/test_phase16_1_verification.mjs` passed with 0 failures, and `npm run build` compiled cleanly with exit code 0.

---

## 2. Current Persistence Architecture

The verified end-to-end data flow is:

### Case Study Data Flow
```text
Admin Case Study Editor (/admin/registry/:id)
                    ↓
        content_registry table
                    ↓
           metadata.caseStudy
                    ↓
      Publication & Visibility Gate
      (status = 'published' AND visibility = 'public')
                    ↓
         CaseStudyRenderer.jsx
                    ↓
  StandardCaseStudy / Custom Component
                    ↓
           Public /work/:slug
```

### Page Builder Data Flow
```text
       Admin Page Builder (/admin/pages/:id)
                    ↓
               pages table
                    ↓
           page_sections table
                    ↓
   Content Registry Synchronization (content_registry)
                    ↓
      Publication & Visibility Gate
      (status = 'published' AND visibility = 'public')
                    ↓
            PageRenderer.jsx
                    ↓
     Public /p/:slug (or canonical /about)
```

---

## 3. Source-of-Truth Responsibilities

| Subsystem | Authoritative Source | Responsibilities Owned |
|---|---|---|
| **Content Registry** | `content_registry` table in Supabase | Content identity (`id`, `slug`, `title`), content type (`content_type`), lifecycle status (`status`), access visibility (`visibility`), canonical routing (`public_route`), sorting (`sort_order`), and the canonical publication gate. |
| **Case Study Body** | `content_registry.metadata.caseStudy` | Semantic structure (`hero`, `challenge`, `contribution`, `evidence`, `technology`), section ordering (`sectionOrder`), and section visibility (`is_visible`). |
| **Page Content & Sections** | `pages` & `page_sections` tables | Composable layout sections (`hero`, `rich_text`, `timeline`, `workflow`, `cta`, `image`, `quote`, etc.), section sorting (`sort_order`), and section configuration JSON (`config`). |
| **Route Resolver** | `contentRouteResolver.js` | Canonical URL computation (`/work/:slug`, `/p/:slug`, `/about`), implemented status registry, and mismatch warnings. |

---

## 4. Publication Authority

The portfolio enforces a **Single Publication Authority**:
- Content Registry is the sole decider of whether an item may appear publicly.
- For a **Case Study**:
  - `content_registry.status === 'published'`
  - `content_registry.visibility === 'public'`
  - `content_registry.metadata.caseStudy` is present and valid
- For a **Page**:
  - `content_registry.status === 'published'`
  - `content_registry.visibility === 'public'`
  - `pages.status === 'published'`
  - At least one section exists and is visible

If any requirement in the gate fails, public renderers (`CaseStudyRenderer.jsx` and `CmsDynamicPage.jsx`) block access and display a safe 404 / Not Found state without leaking internal data or stack traces.

---

## 5. Page Publication Matrix

Tested deterministically via `isPagePubliclyAccessible(page, registryEntry)`:

| Page (`pages.status`) | Registry (`content_registry.status`) | Visibility (`content_registry.visibility`) | Expected Public | Actual Result | Verification Status |
|---|---|---|---|---|---|
| `draft` | `draft` | `private` | **NO** | `false` | Passed |
| `published` | `draft` | `private` | **NO** | `false` | Passed |
| `published` | `published` | `private` | **NO** | `false` | Passed |
| `draft` | `published` | `public` | **NO** | `false` | Passed |
| `published` | `published` | `public` | **YES** | `true` | Passed |
| `null` | `published` | `public` | **NO** | `false` | Passed |
| `published` | `null` | `public` | **NO** | `false` | Passed |

---

## 6. Case Study Publication Matrix

Tested deterministically via `isCaseStudyPubliclyAccessible(caseStudyEntry)` and `CaseStudyRenderer.jsx`:

| Registry Status | Registry Visibility | Content Metadata (`metadata.caseStudy`) | Expected Public | Actual Result | Verification Status |
|---|---|---|---|---|---|
| `draft` | `private` | Present | **NO** | `false` | Passed |
| `published` | `private` | Present | **NO** | `false` | Passed |
| `draft` | `public` | Present | **NO** | `false` | Passed |
| `published` | `public` | Absent / Empty | **NO** | `false` | Passed |
| `published` | `public` | Present & Valid | **YES** | `true` | Passed |

---

## 7. Persistence Consistency

A dedicated reconciliation helper was implemented in `src/utils/registryHealth.js`:
```js
getPageRegistryConsistency(page, registryEntry)
```
It evaluates:
- Missing registry entry (`MISSING_REGISTRY_ENTRY`)
- Missing page database record (`MISSING_PAGE_RECORD`)
- Slug mismatch (`SLUG_MISMATCH`)
- Title mismatch (`TITLE_MISMATCH`)
- Publication status mismatch (`STATUS_MISMATCH`)
- Visibility mismatch (`VISIBILITY_MISMATCH`)
- Route mismatch (`ROUTE_MISMATCH`)

Whenever `createPage()`, `updatePage()`, or `deletePage()` is executed in `siteCms.js`, `syncPageWithRegistry()` runs automatically to keep the records reconciled.

---

## 8. Preview Architecture

1. **Case Study Preview**:
   - Previewing draft content in Admin occurs directly within the authenticated Admin CMS (`/admin/registry/:id`) utilizing the live form state in `CaseStudyContentEditor`.
   - The public `/work/:slug` route strictly refuses unauthenticated draft requests.
2. **Page Builder Preview**:
   - The preview button generates a link with `?preview=true` (e.g. `/p/:slug?preview=true` or `/about?preview=true`).
   - In `CmsDynamicPage.jsx`, `canPreviewDraft` is evaluated:
     ```js
     const canPreviewDraft = isPreviewRequested && (isAuthenticated || isEditor);
     ```
   - If an unauthenticated user attempts to append `?preview=true`, `canPreviewDraft` evaluates to `false`, the standard Content Registry publication gate is applied, and access to draft content is blocked.
   - When an authenticated admin previews, an explicit advisory warning banner is rendered at the top of the viewport (`PREVIEW MODE — This is an unpublished preview of page`).

---

## 9. Security

- **No Service-Role Keys**: Client-side bundles contain only the public Supabase anonymous key.
- **Row-Level Security (RLS)**: Enforced directly at the Supabase database level. Public anonymous queries to `content_registry` only receive rows where `status = 'published'` and `visibility = 'public'`.
- **Draft Isolation**: Unpublished or private drafts cannot be enumerated or scraped by unauthenticated visitors.
- **Legacy Source Isolation**: Neither `src/data/caseStudies.js` nor the legacy `case_studies` table participate in the public runtime.

---

## 10. Failure Handling

1. **Page Save Failure**:
   - If `updatePage` fails on the `pages` table, the mutation aborts immediately, feedback is displayed in red, and Content Registry is not falsely updated.
2. **Registry Sync Failure**:
   - If the `pages` table update succeeds but Content Registry sync throws an error, the error is caught, logged, and surfaced so the author is not falsely informed that the page is live.
3. **Network / Supabase Unavailability**:
   - If Supabase is unreachable, public renderers catch the network exception and render a safe error state rather than crashing the React application.

---

## 11. Files Changed

1. `src/utils/registryHealth.js`:
   - Added `getPageRegistryConsistency(page, registryEntry)`.
   - Added `isPagePubliclyAccessible(page, registryEntry)`.
   - Added `isCaseStudyPubliclyAccessible(caseStudyEntry)`.
   - Added `getPagePublishingReadiness(page, sections)`.
   - Added architectural documentation distinguishing Registry Health, Publishing Readiness, and Persistence Consistency.
2. `src/services/siteCms.js`:
   - Added `syncPageWithRegistry(page)`.
   - Integrated `syncPageWithRegistry` into `createPage` and `updatePage`.
   - Integrated cleanup in `deletePage` for `content_type = 'page'`.
3. `src/pages/CmsDynamicPage.jsx`:
   - Integrated Content Registry publication gate check via `getPublishedPublicContentBySlug(slug)`.
   - Enforced `isPagePubliclyAccessible(pageRes.data, registryRes.data)`.
4. `src/pages/AboutPage.jsx`:
   - Integrated Content Registry publication authority check via `getPublishedPublicContentBySlug('about')`.
5. `src/admin/pages/AdminPageEditor.jsx`:
   - Imported `getPagePublishingReadiness`.
   - Added `handleSaveDraft` and `handlePublishPage` with validation and confirmation.
   - Updated top action bar with distinct "Save Draft" and "Publish Page" buttons.
6. `src/admin/pages/AdminPages.jsx`:
   - Updated preview URL for `/about` to `/about?preview=true`.
7. `src/admin/pages/AdminRegistryEntry.jsx`:
   - Added Page Builder integration card when `contentType === 'page'` linking to the visual editor.

---

## 12. Tests

Ran automated verification suite:
```bash
node --loader ./scratch/mock-loader.mjs scratch/test_phase16_1_verification.mjs
```

### Test Results
```text
=== RUNNING PHASE 16.1 PERSISTENCE, PUBLICATION & CONSISTENCY TESTS ===

1. Route Resolution Verification:
  ✓ Case study resolves to /work/:slug
  ✓ Page canonical route resolves to /p/:slug
  ✓ Case study public route is marked implemented
  ✓ Page public route is marked implemented
  ✓ Blog public route is marked NOT implemented (future)
  ✓ Agent public route is marked NOT implemented (future)

2. Page Publication Consistency Matrix (Section 5):
  ✓ Matrix test: draft + draft + private -> NO (got false)
  ✓ Matrix test: published + draft + private -> NO (got false)
  ✓ Matrix test: published + published + private -> NO (got false)
  ✓ Matrix test: draft + published + public -> NO (got false)
  ✓ Matrix test: published + published + public -> YES (got true)
  ✓ Null page -> NOT public
  ✓ Null registry -> NOT public
  ✓ Both null -> NOT public

3. Case Study Publication Rules:
  ✓ CS draft + private -> NOT public
  ✓ CS published + private -> NOT public
  ✓ CS draft + public -> NOT public
  ✓ CS published + public without content -> NOT public
  ✓ CS published + public + valid content -> YES public

4. Page ↔ Registry Consistency Helper (Section 10):
  ✓ Fully consistent records report isConsistent = true
  ✓ No issues reported for consistent records
  ✓ Missing registry reports isConsistent = false
  ✓ Identifies MISSING_REGISTRY_ENTRY
  ✓ Missing page reports isConsistent = false
  ✓ Identifies MISSING_PAGE_RECORD
  ✓ Slug mismatch reports isConsistent = false
  ✓ Identifies SLUG_MISMATCH
  ✓ Title mismatch reports isConsistent = false
  ✓ Identifies TITLE_MISMATCH
  ✓ Status mismatch reports isConsistent = false
  ✓ Identifies STATUS_MISMATCH
  ✓ Visibility mismatch reports isConsistent = false
  ✓ Identifies VISIBILITY_MISMATCH
  ✓ Route mismatch reports isConsistent = false
  ✓ Identifies ROUTE_MISMATCH

5. Page Publishing Readiness (Section 11 & 14):
  ✓ Empty page is NOT ready to publish
  ✓ Blocks on missing title
  ✓ Blocks on missing slug
  ✓ Blocks on no visible sections
  ✓ Valid page with visible section is ready to publish
  ✓ No blocking gates for valid page
  ✓ Image missing alt text does NOT block publish
  ✓ Image missing alt text generates advisory warning

=============================================================
✓ ALL PHASE 16.1 AUTOMATED TESTS PASSED SUCCESSFULLY (0 failures).
```

---

## 13. Build

Ran production compilation:
```bash
npm run build
```

### Build Result
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
dist/assets/index-y5403sK1.js         1,186.20 kB │ gzip: 297.33 kB
✓ built in 4.47s
```
Exit code: `0`.

---

## 14. Known Limitations

- **Browser Subagent Capacity**: Automated Chromium session encountered an upstream cloud provider 503 error (`No capacity available for model gemini-3-flash`). Full static, unit, and HTTP verification was performed locally instead.
- **Relational Tables vs JSONB**: `pages` and `page_sections` remain separate relational tables in Supabase. They are synchronized with `content_registry` rather than merged into a single table. This preserves existing data with zero downtime.

---

## 15. Deferred Work

The following items remain strictly out of scope for Phase 16.1:
- Blog implementation (routes, editors, and schemas)
- AI Agents and Plugins content types
- Collaborative real-time editing / concurrent locks
- Multi-revision historical version rollbacks
- Supabase Storage migration for assets
- Public draft tokens

---

## 16. Deployment

NO DEPLOYMENT PERFORMED.
