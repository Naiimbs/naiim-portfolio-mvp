# Database Reconciliation — My Website / My Academy

**Audit date:** 2026-11-10  
**Supabase project:** `mywebsite` (`btrrvoalqzapnmvqygnp`, `eu-west-1`)  
**PostgreSQL:** 17  
**Repository branch:** `feature/my-academy-mvp`

## Executive result

The live database is not missing the existing CMS schema. The mismatch is primarily in migration tracking:

- Repository: 25 SQL migration files, `001` through `025`.
- Remote Supabase migration history: only `20261110072535_security_hardening_phase_1` and `20261110072557_function_search_path_hardening`.
- Live database: 23 public tables; all 23 have RLS enabled.
- No `academy_*` tables exist yet.
- PostgreSQL 17 is active and healthy.

**Do not replay migrations 001–025 against the live project.** Several create tables, types, policies, storage configuration and seeded CMS content that already exist. Replaying them blindly can fail on non-idempotent policy/type operations or overwrite data.

## Structural cross-check

The live 23-table inventory aligns with the table-creation groups in the repository migrations:

| Migration group | Live tables |
|---|---|
| 001 | profiles, media, projects, case_studies, case_study_sections, section_blocks |
| 003 | agents, agent_case_studies, agent_case_study_sections, agent_section_blocks |
| 004 | mcp_connections, agent_runtime_configs |
| 006 | pages, page_sections, navigation_items, site_settings |
| 007 | content_registry |
| 014 | marketing_leads, resource_downloads, donations |
| 016 | resource_ingest_rate_limits |
| 019 | post_views, post_feedback |
| **Total** | **23** |

Additional live-state checks:
- `pages.published_snapshot` exists, matching migration 021.
- `mcp_connections` contains the later transport/auth/server URL/metadata fields from migration 005.
- The four expected enums exist: `user_role`, `content_status`, `case_study_type`, `agent_demo_type`.
- The live schema has no Academy tables and no vector extension; that is expected before the AI/RAG phase.

This is a structural cross-check, not yet a byte-for-byte schema diff. Before marking the old migrations as applied, compare the full remote schema (columns, defaults, constraints, indexes, triggers, policies, functions and storage objects) with the effects of each migration.

## Migration-history recovery — safe procedure

1. Take and verify a recoverable database backup/snapshot.
2. Run `supabase migration list` with the linked project and archive its output.
3. Generate a remote schema snapshot/diff and compare it against migrations 001–025. Review data-seed effects separately; migration repair does not run seed SQL.
4. Resolve every mismatch explicitly. Do not infer that a migration ran merely because its main table exists.
5. Only after the full effects of a migration are verified, use the supported Supabase CLI command `supabase migration repair --status applied <version>` to reconcile that version's tracking record. Do not insert rows directly into `supabase_migrations.schema_migrations`.
6. Re-run `supabase migration list` and verify that local and remote histories agree.
7. From this point forward, create every new migration locally with `supabase migration new <descriptive_name>`, test it against a clean local database, commit it, then deploy through the migration workflow. Do not make ad-hoc remote DDL changes.

The Supabase CLI is not available in the current execution environment, so migration-history repair has **not** been attempted. The live database has not been altered during this audit.

## Existing security posture and findings

### Confirmed good controls
- RLS is enabled on all 23 public tables.
- `resource_ingest_rate_limits` has RLS enabled, no policies, and no `anon` or `authenticated` table grants. It is currently inaccessible to client roles; do not add a permissive policy just to silence the advisor.
- The three existing SECURITY DEFINER functions have an empty `search_path`, as recorded by the two already-applied hardening migrations.

### Items to handle deliberately
- `public.is_admin()` is used by existing CMS RLS policies. Do not revoke its execute privilege without redesigning those policies and testing anonymous CMS reads.
- `get_post_rating_summary` and `increment_post_view` are public-facing RPCs; inspect their function bodies and call sites before changing privileges.
- Supabase Auth leaked-password protection is disabled. This is a dashboard Auth setting, not an Academy schema migration.
- Performance advisor reports six existing foreign keys without covering indexes and multiple permissive policies in the legacy CMS. These are existing CMS debt; do not mix broad CMS policy rewrites into the Academy foundation migration.

## Academy database boundary

My Academy will use dedicated `academy_*` tables in the existing project. It will not store learning data in `pages`, `page_sections`, or `content_registry`.

The proposed MVP model and security contract are in [My Academy Database Design](./my-academy-database-design.md).

No live schema changes have been made as part of this reconciliation. The next database change must be a reviewed, timestamped migration after the migration-history baseline is repaired.
