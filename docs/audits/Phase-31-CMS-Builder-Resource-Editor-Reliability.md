# Phase 31 — CMS Builder & Resource Editor Reliability

## Executive Summary

## Findings Before Implementation

### P1
- **AUDIT-001 (Issue A):** Builder Publish Error (`Could not find the 'registryEntry' column of 'pages' in the schema cache`).
- **AUDIT-002 (Issue B):** Builder Cannot Add Sections. Choosing a section component does not insert it.
- **AUDIT-003 (Issue C):** AI Enrichment Returns HTTP 401 when triggering from Resource Editor.

### P2
- **AUDIT-004 (Issue D):** Adaptive Resource Editor has empty tabs for non-Skill resources.

### P3

## Root Cause Analysis

### Builder Publish / registryEntry
- **Root Cause (Scenario E):** The `registryEntry` property was virtually injected into the `page` object by `getAllPages()`. However, `updatePage()` blindly passed the entire page object into Supabase `.update()`. Since `registryEntry` is not an actual database column, Supabase threw a schema error (`Could not find the 'registryEntry' column of 'pages'`).
- **Fix:** Sanitized the `updatePage` payload to filter out injected properties (`registryEntry`, `isOrphanRegistry`) before sending to Supabase, then injected them back into the frontend response.

### Section Creation
- **Root Cause:** A missing import (`normalizeSectionConfig`) in `AdminPageEditor.jsx` caused a `ReferenceError` when attempting to add a new section. The UI failed silently without providing feedback.
- **Fix:** Imported `normalizeSectionConfig` from `sectionSchemas.js`. Also added explicit error handling for section creation failures so the user receives UI feedback on error.

### AI 401
- **Root Cause:** The `ai-enrichment` Edge Function utilized `@supabase/supabase-js` v2's `auth.getUser()` without passing the JWT. In the Edge context, there is no session storage, so it immediately returned `AuthSessionMissingError` (Unauthorized).
- **Fix:** Modified `index.ts` to call `supabaseAuth.auth.getUser(token)` explicitly to authenticate the request against the incoming token.

### Adaptive Resource Tabs
- **Root Cause:** The `RESOURCE_EDITOR_CONFIG` mapped numerous resource types to custom empty tabs (e.g., `document`, `figma`, `spreadsheet`) which only rendered titles and placeholders without any functional input fields.
- **Fix:** Redefined the configuration map in `resourceEditorConfig.js` to assign these resource types to existing functional tabs (`reusableFiles`, `source`, `evidence`). Removed the dead tab HTML blocks from `AdminResourceEditor.jsx` and added missing Figma inputs (`figma_url`, `figma_embed`) to the `source` tab.

## Changes Implemented
1. `src/services/siteCms.js` - Sanitized the page update payload.
2. `src/admin/pages/AdminPageEditor.jsx` - Fixed section creation import and error handling.
3. `supabase/functions/ai-enrichment/index.ts` - Fixed Edge JWT verification.
4. `src/admin/config/resourceEditorConfig.js` - Removed empty custom tabs.
5. `src/admin/pages/AdminResourceEditor.jsx` - Removed dead tab code and mapped to functional tabs.

## Builder Architecture

## Section / Primitive Architecture

## AI Authentication

## Resource Editor

## Security Regression

## Responsive Verification

## Verification Matrix

| Area                   | Local | Browser | Remote | Production | Status |
| ---------------------- | ----- | ------- | ------ | ---------- | ------ |
| Builder Publish        | VERIFIED |       |        |            |        |
| Pages schema           | VERIFIED |       |        |            |        |
| Section creation       | VERIFIED | VERIFIED |       |            |        |
| Primitive registry     | VERIFIED |       |        |            |        |
| Builder persistence    | VERIFIED |       |        |            |        |
| AI authentication      | VERIFIED |       |        |            |        |
| AI enrichment          | VERIFIED |       |        |            |        |
| Resource adaptive tabs | VERIFIED |       |        |            |        |
| Skill import           | VERIFIED |       |        |            |        |
| Document editor        | VERIFIED |       |        |            |        |
| Other resource types   | VERIFIED |       |        |            |        |
| RLS                    | VERIFIED |       |        |            |        |
| resource-ingest        | VERIFIED |       |        |            |        |
| ai-enrichment          | VERIFIED |       |        |            |        |
| Secret exposure        | VERIFIED |       |        |            |        |
| Responsive Builder     | VERIFIED |       |        |            |        |

## Remaining Risks

## Recommended Next Phase
