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
4. Updates only the authenticated caller's `app_metadata`, preserving existing metadata and setting `iqra_role=admin`.
5. The client refreshes its session and checks the new claim.

The function source is not deployed by this branch. Deployment and the first role activation require a separate reviewed release step. The platform's default JWT verification remains enabled for this function; it also verifies the bearer token with Supabase Auth inside the handler. The Edge Function dependency is pinned to the CMS project's current `@supabase/supabase-js` version.

## Security constraints

- IQRA RLS remains authoritative even when the CMS route guard allows a page to render.
- Never trust `user_metadata` or a role value supplied by the browser.
- Never accept a target user ID in the bootstrap request; it can only activate the authenticated CMS admin.
- Keep the service-role key inside the Edge Function environment.
- Role revocation must remove `app_metadata.iqra_role` through a trusted server-side administrative process and invalidate/refresh sessions. This is a separate lifecycle task before Production.

## Validation

Run:

```bash
npm run test:academy-access
npm run test:iqra-cms
npm run build
```

These checks validate the CMS integration source and build. They do not validate a hosted Supabase deployment, do not apply migrations and do not authorize Production changes.

## Explicit Production hold

- No IQRA migration or Storage bucket has been applied to hosted Supabase.
- This branch does not deploy the Edge Function.
- Do not merge, deploy, grant Production roles or apply SQL until the full role grant/revocation lifecycle, migration diff, backup/rollback plan and end-to-end tests are reviewed and explicitly approved.
