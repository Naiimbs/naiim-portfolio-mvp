# Unified Case Study Architecture — Foundation

## Status

Foundation-only implementation on `feat/unified-case-study-foundation`.
This change adds a lossless, read-time adapter and an allowlisted section
registry. It does not change the public Case Study runtime, CMS editor,
Supabase records, routes, or publishing rules.

## Contract

- V3 is an in-memory normalized contract with one ordered `sections` array.
- Core section types are shared across personal projects.
- Project-specific content is represented as `project-module` sections.
- Editorial and image blocks remain supported as module section types.
- EN, FR, and AR content are resolved independently.
- Visibility and ordering are applied to the same section collection.
- Original V1/V2 data is retained under `legacy`; normalization never writes
  back to Supabase.
- CMS content can select only allowlisted section types. It cannot provide
  React import paths or executable component names.

## Compatibility

Standard V1 fields are projected into core section types. Custom V1/V2
native sections and editorial blocks are projected into the same ordered
collection. Existing native section order and visibility are respected.
Translations for native sections and editorial blocks are retained.

## Deliberate non-goals in this PR

- No runtime route switch from WINNI/Assettini bespoke components.
- No CMS Builder UI or drag-and-drop editor.
- No database migration or data rewrite.
- No removal of legacy renderers.
- No deployment.

## Validation

Run:

```bash
npm run test:unified-case-study
```

The test covers standard/custom normalization, legacy preservation, ordering,
visibility, EN/FR/AR resolution, and unsupported section handling.


## Runtime renderer bridge (Phase 2)

The public registry gate remains unchanged. Standard case studies with
`metadata.caseStudy.version === 3` are routed to `UnifiedCaseStudy`; existing
Standard V1 payloads continue through `StandardCaseStudy`, and WINNI /
Assettini continue through their bespoke components.

The V3 renderer resolves sections through the allowlisted `SectionResolver`,
respects enabled state and order, localizes section content, and renders the
eight core section types plus editorial, image, and project-module blocks.
Unknown section types remain unrendered rather than being interpreted as
component paths. Saved admin preview context is retained.

This phase does not change the CMS editor, convert existing registry records,
write to Supabase, or deploy. The CMS must be upgraded in a later phase before
authors can create and save V3 sections through the admin interface.


## CMS Builder (Phase 3)

The Registry Case Study editor now has a V3-only builder path. Existing Standard
V1 content displays an explicit **Upgrade to V3** action; the conversion is
performed in memory and retains the complete original payload under
`legacy`. The editor does not silently upgrade or write to the database.

The V3 builder supports:
- Editing the Project Overview metadata and section content
- Adding each core section type once
- Adding repeatable Editorial, Image, and Project-specific Module blocks
- Reordering by drag-and-drop or accessible move controls
- Hiding and removing sections
- Editing EN / FR / AR content and structured JSON fields
- Preserving locale fallback: untranslated fields inherit English copy

Registry normalization keeps V3 `sections` intact, resolves known bundled
media references, and merges legacy Registry translations only where V3
section-localized content has not supplied an override. Publishing readiness
requires a visible Project Overview with a title and lead; the other core
sections remain optional.

The editor remains compatible with the existing V1 Standard and V2 bespoke
WINNI / Assettini paths. This phase does not migrate Supabase records
automatically, alter RLS, or deploy.
