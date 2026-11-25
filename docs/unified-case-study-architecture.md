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
