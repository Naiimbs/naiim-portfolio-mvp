# My Academy — Production Release Readiness

**Project:** `mywebsite` (`btrrvoalqzapnmvqygnp`, `eu-west-1`)  
**Release branch:** `release/my-academy-clean`  
**Audit date:** 2026-11-10

## Decision

**Do not apply Academy migrations to Production yet.** The Academy code has been isolated from the development branch, but Production backup verification and the complete migration-history reconciliation are still release gates. No Academy SQL has been applied to Production.

## Verified Production inventory

Read-only catalog inspection returned:

| Object | Live count |
|---|---:|
| Public tables | 23 |
| Public columns | 242 |
| Public constraints | 59 |
| Public indexes | 85 |
| Public RLS policies | 40 |
| Public triggers | 5 |
| Public functions | 6 |
| Tables with RLS enabled | 23 / 23 |

The four public enums are present:
- `user_role`: `admin, editor, viewer`
- `case_study_type`: `standard, custom`
- `agent_demo_type`: `none, external, embedded, internal`
- `content_status`: `draft, published, archived, in_review, ready`

Storage currently has the public `portfolio-media` bucket and two object policies (public read and admin/editor management). Do not alter these as part of Academy.

### Existing data — do not overwrite

| Table | Rows |
|---|---:|
| pages | 8 |
| page_sections | 42 |
| content_registry | 40 |
| navigation_items | 14 |
| projects | 9 |
| case_studies | 9 |
| agents | 2 |
| marketing_leads | 10 |
| resource_downloads | 19 |
| post_views | 8 |
| post_feedback | 6 |
| resource_ingest_rate_limits | 44 |

These counts make clear why a recoverable data backup and a verified restore path are mandatory before schema changes or migration-history repair.

## Legacy migration inventory (001–025)

| Migration | Intended effects / reconciliation notes |
|---|---|
| 001 | Initial CMS tables, enums, indexes, RLS and admin helper |
| 002 | `portfolio-media` storage bucket and object policies |
| 003 | Agent CMS tables, enum, indexes and policies |
| 004 | MCP connections and agent runtime configuration |
| 005 | MCP connection v2 columns and indexes |
| 006 | Pages, page sections, navigation, settings, updated-at triggers and policies |
| 007 | Content Registry, indexes, RLS and updated-at trigger |
| 008 | Data transformation of legacy case-study content into Content Registry |
| 009 | About registry entry and default header/footer navigation data |
| 010 | Registry content-type constraint update and CMS seed/integrity data |
| 011 | `content_status` values and registry status/content-type constraint updates plus content seeds |
| 012 | Navigation/blog seed data |
| 013 | Resources system registry constraint and seed data |
| 014 | Marketing leads, resource downloads, donations, indexes and RLS |
| 015 | CMS RLS/privilege hardening and admin helper update |
| 016 | Private resource-ingestion rate-limit table/function and public insert privilege tightening |
| 017 | Home page CMS seed data |
| 018 | Work page CMS seed data |
| 019 | Blog views/feedback tables, RPCs and policies |
| 020 | Admin read policy for post feedback |
| 021 | `pages.published_snapshot` column |
| 022 | Blog route synchronization data updates |
| 023 | Content Registry public-route normalization |
| 024 | Content Registry sort-order normalization |
| 025 | About page CMS seed data |

### Reconciliation status

- The live table inventory aligns with the table-creation groups in migrations 001, 003, 004, 006, 007, 014, 016 and 019.
- Live columns, enum values, constraints, indexes, policies, triggers and function definitions were inspected. The final live state contains later additions such as `pages.published_snapshot`, `content_status.in_review/ready`, and `content_registry.content_type = 'page'`.
- The Storage bucket and its two object policies match the expected storage setup.
- The data counts and key seed records are present, but **a complete row-by-row verification of every data migration (especially 008–013 and 017–025) is not yet complete**. Do not mark all old migrations applied solely from matching table names or counts.
- Remote migration history currently lists only `20261110072535_security_hardening_phase_1` and `20261110072557_function_search_path_hardening`. The repository's 001–025 history is not reconciled with that ledger.
- The two remote hardening versions do not currently have matching timestamped SQL files in this release branch. Their exact original migration SQL must be recovered or reconstructed and reviewed before claiming local/remote migration histories are identical.

### Historical clean-replay defect

The release baseline's original `007_cms_registry.sql` constraint does not allow `content_type = 'page'`, but migration 009 inserts the About entry with `content_type = 'page'`. Migration 011 later expands the allowed content types, which is too late for migration 009 on a clean replay.

The development branch changed historical migration 007 to allow `page` early. That change was intentionally **not** copied into this Academy-only release branch. Resolve this as a separate legacy migration-baseline fix, then rerun clean replay. Do not hide this defect by editing Production or by changing migration history.

## Official migration-history repair procedure

Use the Supabase CLI, not direct SQL writes to `supabase_migrations.schema_migrations`:

1. Verify a recoverable Production backup and document its timestamp/restore procedure.
2. Run and archive `supabase migration list` against the linked Production project.
3. Finish the schema **and data** comparison for every migration version.
4. Recover/review the two timestamped hardening migrations that are already in the remote ledger.
5. Only for a migration whose complete effects are verified as already present, run:
   `supabase migration repair <version> --status applied`
6. Re-run `supabase migration list`; confirm there are no unexplained local/remote versions or pending migrations.
7. From then on, create new migrations with `supabase migration new <name>` and deploy them through the reviewed release workflow.

The available connected Supabase operations do not expose the CLI migration-repair command. No direct ledger writes or repair attempts have been made.

## Backup gate

Before repair or Academy DDL:
- Confirm a recent successful Supabase-managed backup/snapshot exists in the project's **Database → Backups** page, or take a manual backup using the supported project backup process.
- Supabase documents daily automated database backups for Pro, Team and Enterprise plans (7, 14 and up to 30 days of retention respectively); Free projects should export data regularly with the CLI. Verify the actual plan and backup timestamp in the Dashboard.
- Record the backup timestamp and verify the restore path (ideally restore to a separate project before production work).
- **Storage object files are not included in database backups.** Back up the actual files in the `portfolio-media` bucket separately (for example through Storage/S3-compatible export); the database backup only contains Storage metadata.
- Do not treat a schema-only dump as a full production backup; existing CMS rows and Storage objects matter.

No backup was created or verified through the connected tools in this session.

## Academy-only release contents

The branch is based directly on `migration/react-phase-1` and contains Academy-specific UI, admin access gating, the two Academy migrations, static access checks, and documentation. It intentionally excludes:
- changes to historical migrations 001–025 (including the modified 007),
- Supabase config changes,
- seed.sql changes,
- the unrelated legacy AI Lab.

The branch is a code-preparation branch, not a production deployment.

## Supabase Auth password protection

The Production Auth audit previously found **Leaked Password Protection disabled**. Supabase documents this setting as using Have I Been Pwned's Pwned Passwords API to reject known-compromised passwords. It is available on Supabase Pro and above.

Enable it in the Supabase Dashboard:
1. Open **Authentication → Providers → Email** (the project's Auth password settings).
2. Set a minimum password length of at least 12 characters.
3. Require lowercase, uppercase, digits and symbols.
4. Enable **Prevent the use of leaked passwords / Leaked password protection**.
5. Save, then re-check the setting.

This is an Auth dashboard setting, not a SQL migration. The connected Supabase tools do not expose the Auth password-security settings, so the setting has **not** been changed or verified as enabled here. Existing users may continue signing in with their current passwords; new or changed passwords are subject to the stronger policy.

## Release gates still open

- [ ] Complete data-migration verification for 008–013 and 017–025.
- [ ] Recover and reconcile the two remote timestamped hardening migrations.
- [ ] Resolve the historical 007 → 009 clean-replay defect in a separate baseline fix.
- [ ] Verify a recoverable Production backup and restore path.
- [ ] Use official Supabase CLI migration repair for only fully verified versions.
- [ ] Confirm Leaked Password Protection is enabled in Auth settings.
- [ ] Run clean replay, Academy access checks, build and real RLS tests.
- [ ] Apply the Academy migrations only after the above gates pass.
- [ ] Keep Academy routes admin-only and all new course/lesson records in Draft.
