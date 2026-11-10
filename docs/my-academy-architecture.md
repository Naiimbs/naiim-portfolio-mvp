# My Academy — Architecture & MVP Delivery Plan

**Repository:** `Naiimbs/naiim-portfolio-mvp`  
**Production/release branch:** `migration/react-phase-1`  
**Feature branch:** `feature/my-academy-mvp`  
**Supabase project:** `mywebsite` (`eu-west-1`)  
**Last reviewed:** 2026-11-10

## Product and architecture decision

My Academy is a dedicated LMS module inside the existing React CMS admin. It is not a separate website/domain and it is not a CMS page template.

- **CMS:** portfolio pages, blog, projects, media, SEO and editorial content.
- **My Academy:** its own `academy_*` data model and learning workflows.
- **Legacy learning experiment:** leave the old CMS-based learning page untouched until a separate keep/archive/remove decision.
- **AI services:** MinerU/document processing, AI Course Builder, RAG and AI Tutor are later integrations around the LMS, not dependencies of the core LMS.

V1 is single-instructor: one administrator manages the academy. Multi-instructor, multi-tenant, marketplace, payments and subscriptions are out of scope.

## Current implementation on the feature branch

### Implemented in the admin preview

- Admin-only Academy routes under `/admin/academy`.
- Academy navigation is shown only to administrator accounts.
- Course management: list, create, edit, status and archive lifecycle.
- New courses default to `draft`.
- Curriculum editor: ordered modules and lessons; new lessons are saved as drafts in versioned JSONB content.
- Admin-managed enrollment UI for existing learner Auth accounts; it does not create users or send invitations.
- Attempt-integrity SQL migration: learner ownership checks, attempt-limit enforcement and immutable attempt identity fields.
- Separate administrator-only answer-key table in the schema design.

### Not implemented yet

- Learner-facing Student Portal and lesson player.
- Learner progress UI and completion workflow.
- Assessment authoring UI and trusted grading service.
- MinerU document ingestion, AI Course Builder, embeddings, RAG and AI Tutor.

The dashboard now labels these as planned rather than presenting them as completed features.

## Validation completed

GitHub Actions **Run #21** passed on feature commit `4789b61c8be897fa23fd1881132c0f13222ae74f`:

1. Start a clean local Supabase stack.
2. Replay all repository migrations on a clean local database.
3. Install Node dependencies.
4. Run `npm run test:academy-access` to check admin-only routes, private-schema access, RLS coverage, answer-key isolation and attempt-integrity safeguards.
5. Run the React production build.
6. Stop the local test stack.

This proves the repository migrations replay cleanly locally and the static access-boundary checks/build pass. It does **not** prove the remote Production database is reconciled, nor does it constitute a production deployment.

## Production database status and release blocker

The live project is healthy and currently has 23 public tables, all with RLS enabled. No `academy_*` tables exist in Production.

The remote Supabase migration ledger contains only:
- `20261110072535_security_hardening_phase_1`
- `20261110072557_function_search_path_hardening`

The repository contains older migrations `001–025` whose schema effects already exist in the live database. Do **not** replay those migrations blindly, and do not insert rows directly into Supabase's migration-history table.

Before applying Academy DDL:
1. Take/verify a recoverable Production backup.
2. Compare the complete remote schema (columns, defaults, constraints, indexes, triggers, functions, policies and storage objects) with the effects of migrations `001–025`.
3. Repair migration tracking with the supported Supabase CLI only after each migration's full effects are verified.
4. Re-run local/remote migration-list checks.
5. Apply only the reviewed Academy migrations.

The current execution tools do not provide the Supabase CLI migration-repair command. No Academy migration has been applied to Production, and no production deployment has occurred.

## Release-branch caution

The feature branch is **54 commits ahead** of `migration/react-phase-1` and its comparison includes 20 changed files. It also modifies an existing historical CMS migration (`007_cms_registry.sql`) and Supabase config/seed files.

Do not merge the feature branch wholesale into the release branch. First isolate or cherry-pick the Academy-specific changes into a clean release branch, review the historical migration/config/seed diffs, and keep the CMS database baseline untouched.

## Security audit notes

- Every existing public table has RLS enabled.
- `resource_ingest_rate_limits` has no RLS policies and no `anon`/`authenticated` table grants; it is service-role-only. Keep it that way.
- `public.is_admin()` is used by existing CMS RLS policies whose role is `public`. Do not revoke its execute permission without redesigning and testing those legacy policies.
- `get_post_rating_summary` and `increment_post_view` are public-facing RPCs; inspect their implementations/call sites before changing permissions.
- Supabase Auth leaked-password protection is currently disabled. This is an Auth dashboard setting, not an Academy SQL migration.
- Existing performance-advisor findings include legacy CMS foreign keys without covering indexes and multiple permissive policies. Keep those separate from the Academy foundation unless a dedicated CMS remediation is approved.

## Delivery sequence

1. Finish remote schema and migration-history reconciliation.
2. Isolate Academy changes into a clean release branch.
3. Apply reviewed Academy migrations after backup and validation.
4. Deploy the admin-only preview; keep new courses and lessons in Draft.
5. Implement Student Portal, lesson player and progress.
6. Implement assessment authoring, attempts and trusted grading.
7. Run end-to-end RLS tests as anon, learner A, learner B and admin.
8. Add MinerU document ingestion.
9. Add AI Course Builder.
10. Add course-scoped RAG and AI Tutor with source citations.

## References

- [Database Reconciliation](./database-reconciliation.md)
- [My Academy Database Design](./my-academy-database-design.md)
