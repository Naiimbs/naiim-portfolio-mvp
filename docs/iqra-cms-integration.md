# IQRA ↔ Naiim CMS integration

Status: development implementation on `feature/iqra-cms-integration`. Not deployed.

## Product boundary

- Naiim CMS remains the only administrator interface.
- IQRA remains the independent learner application.
- The CMS Academy routes are an admin client for the IQRA data model; they do not create a second LMS admin application.
- IQRA is the source of truth for courses, modules, lessons and enrollments.

## Data contract

The CMS Academy pages use the `iqra_*` tables from the IQRA repository:

- `iqra_courses`
- `iqra_modules`
- `iqra_lessons`
- `iqra_enrollments`

The CMS `profiles` table is read only for the existing learner identity lookup. It is not the source of IQRA authorization.

The legacy `academy_*` migrations and tables are not the target data model for this integration. Do not apply them to Production or copy their data into IQRA without a separately reviewed migration plan.

## Trusted administrator lifecycle

The existing CMS role and IQRA role are deliberately distinct:

- `profiles.role = 'admin'` is the trusted CMS administrator record.
- `app_metadata.iqra_role = 'admin'` is the server-managed IQRA JWT claim required by IQRA RLS.
- A CMS editor is not automatically an IQRA administrator.
- The browser cannot set `app_metadata` and never receives the Supabase service-role key.

The `iqra-admin-bootstrap` Edge Function:
1. Verifies the caller's bearer token with Supabase Auth.
2. Looks up the caller's `profiles.role` using the service-role client.
3. Rejects anyone whose CMS role is not exactly `admin`.
4. Creates or refreshes the caller's row in `iqra_admin_grants`.
5. Updates only the authenticated caller's `app_metadata`, preserving existing metadata and setting `iqra_role=admin`.
6. The client refreshes its session and checks the new claim.

The `iqra-admin-revoke` Edge Function:
1. Verifies the caller's bearer token and trusted CMS `profiles.role = 'admin'`.
2. Accepts a target account ID only after caller authorization; learners and CMS editors cannot revoke grants.
3. Deletes the target's `iqra_admin_grants` row first, immediately closing the IQRA RLS authorization gate.
4. Removes only `app_metadata.iqra_role`, preserving unrelated metadata.
5. Returns a successful-but-pending cleanup response if metadata cleanup fails; the database grant is already gone, so stale JWTs remain denied.

The IQRA database predicate requires all three signals: the server-managed JWT claim, an active `iqra_admin_grants` row, and the current CMS profile role `admin`. A database trigger removes the IQRA grant when the CMS profile role is downgraded or the profile is deleted. Promoting the CMS profile again does not silently restore IQRA access; the trusted bootstrap flow must be run again.

Both functions require JWT verification at the platform boundary and verify the bearer token again in the handler. Their source is not deployed by this branch. The Edge Function dependency is pinned to the CMS project's current `@supabase/supabase-js` version.

## Security constraints

- IQRA RLS remains authoritative even when the CMS route guard allows a page to render.
- Never trust `user_metadata` or a role value supplied by the browser.
- Never accept a target user ID in the bootstrap request; it can only activate the authenticated CMS admin.
- Keep the service-role key inside the Edge Function environment.
- Role revocation deletes the database-backed grant first, so stale access tokens cannot pass IQRA RLS. Metadata cleanup is performed server-side; no client-side role writes are permitted.

## Validation

Run:

```bash
npm run test:academy-access
npm run test:iqra-cms
deno test --allow-env supabase/functions/iqra-admin-lifecycle/index_test.ts
npm run build
```

The Deno handler tests cover anonymous/invalid tokens, editor grant/revoke rejection, admin grant, target validation, and metadata preservation. IQRA's separate disposable Supabase validation replays the schema and pgTAP suite, including stale-token revocation and CMS role downgrade/re-promotion.

These checks validate the CMS integration source and build. They do not validate a hosted Supabase deployment, do not apply migrations and do not authorize Production changes.

## Explicit Production hold

- No IQRA migration or Storage bucket has been applied to hosted Supabase.
- This branch does not deploy the Edge Function.
- Do not merge, deploy, grant Production roles or apply SQL until the full role grant/revocation lifecycle, migration diff, backup/rollback plan and end-to-end tests are reviewed and explicitly approved.
