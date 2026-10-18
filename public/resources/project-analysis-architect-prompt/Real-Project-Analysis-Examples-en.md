# Real project analysis examples — Naïm Bsili portfolio

These examples show what a grounded answer can look like when the prompt is used against the actual portfolio repository. They describe confirmed source paths and distinguish findings from assumptions. The examples are analysis outputs, not instructions to change production.

## Example 1 — Publishing a new CMS Prompt Resource

**Goal:** Publish a multilingual software-analysis prompt with a detail page, copy action, downloadable files, and a public route.

**Confirmed project overview:** The site is a React/Vite application. Public resource details are rendered by `src/pages/ResourceDetailPage.jsx`; catalog cards are rendered by `src/pages/ResourcesPage.jsx`; resource data is normalized in `src/services/resources.js`; the authoritative live catalog is backed by Supabase `content_registry`; the project deploys through `.github/workflows/manual-vps-deploy.yml`.

**Relevant path:** The resource route is `/resources/:slug`. Prompt-specific parameters are defined in `src/config/resourceTypeDetails.js`, and the public detail page reads `prompt_format`, `model_compatibility`, `variables`, `example_input`, `example_output`, and `safety_notes` from the CMS metadata.

**Confirmed risks:** A resource can appear correctly in Supabase while its downloadable files are missing from the deployed static bundle. The safest order is to commit and deploy assets first, then publish the public CMS record. A route that overlaps the `public/resources/<slug>` asset directory can also be affected by Nginx precedence.

**Recommended plan:** First add and verify the localized files. Then deploy the static assets. Next create one published `content_registry` entry with `resource_type: prompt`, type-specific parameters, localized metadata, workflow guidance, worked example, and asset links. Finally verify the public route, copy button, language switcher, and ZIP download.

**Acceptance criteria:** The CMS detail page shows the Prompt type, all Prompt parameters, the full copy-ready prompt, real workflow examples, translated content, a working bundle link, and no write action occurs before user approval.

## Example 2 — Diagnosing a resource-page 403

**Goal:** Explain why `/resources/project-analysis-architect-prompt` returns 403 even though the asset files return 200.

**Confirmed finding:** `nginx.conf` contains a special regex location for one-segment resource routes. The previous rule tested `$uri/`, and the same slug also exists as a directory under the static `public/resources` tree. Nginx therefore attempted directory handling instead of falling through to the React SPA, which produced 403 Forbidden.

**Minimal implementation plan:** Preserve the deeper static-file behavior for downloadable assets, but make the one-segment route test the file path and fall back to `/index.html` without testing the directory itself. Deploy the exact commit, then check the route, catalog navigation, and a deeper Markdown/ZIP URL.

**Regression risks:** A broad Nginx change could break existing resource downloads or localized routes. The acceptance test must cover `/resources/`, one-segment detail pages, and deeper asset paths separately.

## Example 3 — Auditing the AI-assisted download flow

**Goal:** Add a safe two-step download experience: known contacts download directly; new contacts provide name, surname, and role before download; the flow stays translated.

**Confirmed paths:** The modal is `src/components/resources/ResourceLeadFormModal.jsx`; client marketing calls are in `src/services/marketing.js`; the public resource payload is submitted to the Supabase Edge Function `resource-ingest`; resource details and download assets are resolved by `src/services/resources.js`.

**Confirmed security boundary:** The browser must not be trusted to decide whether an email is already known. The Edge Function must validate the request, apply rate limits and disposable-domain checks, and decide whether profile fields are required. RLS and server-side validation remain the source of truth.

**Recommended tests:** Test an existing contact, a new valid contact, a disposable domain, a malformed address, repeated requests, an unpublished resource, English/French/Arabic labels, and a failed download after a successful lead submission. The prompt should ask the AI to identify the actual function and policies before proposing edits rather than assuming their names.
