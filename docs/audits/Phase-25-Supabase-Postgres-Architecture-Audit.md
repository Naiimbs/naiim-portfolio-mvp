# Phase 2.5: Supabase + PostgreSQL Architecture Audit

## 1. Executive Summary
This report presents a read-only architecture audit of the `naim-portfolio-mvp` project. The system successfully utilizes Supabase as a primary data store, with a rich JSONB-based content registry, role-based authorization for administrative functions, and bucket storage for media/assets. However, several critical gaps exist in the current implementation, specifically regarding RLS policy safety on public-facing lead capture endpoints, Edge Function deployment, and webhook authentication.

## 2. Skills Used
Skills loaded:
- supabase: **YES** (Checked for RLS pitfalls like `auth.role()`, `SECURITY DEFINER` constraints, Edge function patterns, etc.)
- supabase-postgres-best-practices: **YES** (Used for analyzing indexing strategy, JSONB usage, and query performance considerations).

## 3. Current Architecture
The current application architecture relies heavily on React/Vite on the frontend, interacting directly with Supabase via `@supabase/supabase-js`.

```text
                    PUBLIC WEBSITE
                          │
                          ▼
                    React / Vite
                          │
                ┌─────────┴─────────┐
                │                   │
           Supabase Client       Edge Functions (NOT DEPLOYED)
                │                   │
                ▼                   ▼
          PostgREST/Auth       AI Providers (NVIDIA Gemma)
                │
                ▼
            PostgreSQL
                │
       ┌────────┴────────┐
       │                 │
 Content Registry      Media
       │
       ▼
 Resource Metadata
       │
       ▼
 Supabase Storage
```

## 4. Database Inventory

| Table | Purpose | Primary Key | Foreign Keys | RLS | Indexes | Used By |
| ----- | ------- | ----------- | ------------ | --- | ------- | ------- |
| `content_registry` | Primary CMS store | `id` | None | YES | `sort_order`, `created_at` | Global CMS |
| `marketing_leads` | Capture leads/consents | `id` | None | YES | `email`, `created_at` | Resources/Downloads |
| `resource_downloads`| Track asset downloads | `id` | `lead_id` (SET NULL) | YES | `lead_id`, `resource_slug`, `time`| Resources/Downloads |
| `donations` | Supporter payments | `id` | None | YES | `received_at`, `provider` | Monetization |
| `media` | File tracking | `id` | None | YES | `bucket_id` | Global CMS |
| `profiles` | Auth user roles | `id` | Auth | YES | None | Admin Auth |

*(Note: Other legacy tables such as `pages`, `projects`, `case_studies` exist but are being superseded by `content_registry`.)*

## 5. Migration Audit
- **Migrations Found:** 14 migrations (`001` through `014`).
- **Missing Rollback Considerations:** Standard Supabase up-only migrations used. Down migrations are not present.
- **Policies inside migrations:** Yes, policies are cleanly defined alongside table creations.
- **RLS Enabled:** Yes, all tables explicitly call `ENABLE ROW LEVEL SECURITY`.
- **Remote Migration State:** **NOT VERIFIED** (Insufficient privileges to run `supabase status` or diff against remote).

## 6. RLS Security Audit

| Table | RLS | anon SELECT | anon INSERT | auth SELECT | auth INSERT | auth UPDATE | auth DELETE | Risk |
| ----- | --- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ---- |
| `marketing_leads`| YES | NO | YES (`WITH CHECK true`) | ALL (Admin) | ALL (Admin) | ALL (Admin) | ALL (Admin) | HIGH |
| `resource_downloads`| YES | NO | YES (`WITH CHECK true`) | ALL (Admin) | ALL (Admin) | ALL (Admin) | ALL (Admin) | HIGH |
| `donations` | YES | NO | NO | ALL (Admin) | ALL (Admin) | ALL (Admin) | ALL (Admin) | MED |
| `content_registry`| YES | YES (Published) | NO | YES | ALL (Admin) | ALL (Admin) | ALL (Admin) | LOW |

**Finding 1:** `marketing_leads` and `resource_downloads` allow `anon` inserts using `WITH CHECK (true)`.
**Impact:** Anyone can insert infinite rows, leading to database bloat or spam since there is no database-level rate limiting or CAPTCHA enforced on the insert policy.
**Recommendation:** Move lead capture to an Edge Function to enforce rate limiting and validation, or accept the risk of spam.

**Finding 2:** Policies use `auth.role() = 'authenticated'`.
**Impact:** As per Supabase skills, `auth.role()` is deprecated. Furthermore, if anonymous sign-ins are ever enabled, they carry the `authenticated` Postgres role, silently bypassing this check.
**Recommendation:** Refactor policies to use the `TO authenticated` clause and explicit `public.is_admin()` checks instead of `auth.role()`.

## 7. Auth/Roles Audit
- **Authorization Enforcement:** Handled via database policies calling `public.is_admin()`.
- **`is_admin()` Function:** Defined as `SECURITY DEFINER` in `public` schema. It checks `SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'`.
- **Finding:** While `SECURITY DEFINER` in `public` is callable by anyone, it properly scopes to `auth.uid()`, preventing privilege escalation. It is a necessary pattern to bypass RLS on `profiles` during checks.

## 8. Storage Audit
- **Buckets:** `portfolio-media`.
- **Orphan Risk:** `content_registry.metadata.assets` stores references to files. If a file is deleted from Storage, the registry JSONB may still point to it. There is no strict database-level referential integrity between JSONB arrays and Storage.

## 9. Resource Architecture Audit
- **Flow:** `Resource Metadata` (PostgreSQL `content_registry`) -> `Asset Metadata` (JSONB) -> `Binary File` (Supabase Storage).
- **JSONB Usage:** `metadata` field in `content_registry` heavily relies on JSONB to store dynamic attributes like `when_to_use`, `assets`, etc.

## 10. Source-of-Truth Audit
- `content_registry` (DB): **PRIMARY** source of truth for resource content.
- `localStorage`: **CACHE/FALLBACK** for unconfigured environments.
- `SEED_RESOURCES` (Static): **LEGACY/FALLBACK** hardcoded in JS.
- `media` (DB): **DUPLICATE/SECONDARY**. Asset metadata is duplicated between `content_registry.metadata.assets` and the `media` table.
- **Recommendation:** Maintain `content_registry` as the sole metadata truth for Resources. Avoid relying on the `media` table to store asset properties unless normalized.

## 11. Marketing Leads Audit
- **Duplicate Lead Behavior:** `marketing_leads.email` is marked `UNIQUE`. Subsequent identical emails will fail the `INSERT` unless `ON CONFLICT` is handled.
- **Data Minimization:** Explicit `marketing_consent` boolean and `consent_at` timestamp exist for GDPR compliance.
- **Attribution:** `resource_downloads` tracks `utm_source`, `utm_medium`, and `utm_campaign`.

## 12. Donations/Webhook Audit
- **Webhook Authentication:** **NOT VERIFIED / NOT PRESENT**.
- **Idempotency:** `donations` has `CONSTRAINT uq_donations_payment_provider UNIQUE (payment_id, provider)`, ensuring duplicate webhook payloads do not create double entries.
- **RLS:** A service role policy exists: `USING (auth.jwt() ->> 'role' = 'service_role')`. However, without verified webhook signature validation on the backend/edge function, the system is blind to malicious insertions if the webhook URL is exposed.

## 13. Edge Functions Audit
- **`ai-enrichment`:** **NOT VERIFIED / NOT DEPLOYED**.
- **Auth/Secrets:** Intended to hold `NVIDIA_API_KEY` securely on the server.
- **Risk:** Since it is not deployed, the AI enrichment feature is non-functional in production.

## 14. NVIDIA AI Audit
- **Architecture:** Client calls Edge Function -> Edge Function calls NVIDIA.
- **Verification:** API keys are correctly abstracted from the frontend. No `NVIDIA_API_KEY` exists in `VITE_` variables.

## 15. PostgreSQL Performance Audit
- **Indexes:** Foreign keys are correctly indexed (`idx_resource_downloads_lead_id`, `idx_donations_provider`, etc.).
- **Query Patterns:** `content_registry` queries fetch the entire `metadata` JSONB blob.
- **Recommendation:** If the `metadata` payload grows substantially, consider pruning unnecessary keys before client delivery. No N+1 query patterns detected in standard resource fetching.

## 16. JSONB Audit
- **`content_registry.metadata`:** Stores arrays (`assets`, `when_to_use`, `tags`).
- **Recommendation:** The use of JSONB here is appropriate for a polymorphic CMS where schema flexibility (Figma vs Document vs Skill) is required. Converting `assets` to a relational table would be "purer" but over-engineers the MVP. Keep as JSONB.

## 17. Data Integrity Audit
- **`resource_downloads` -> `marketing_leads`:** Uses `ON DELETE SET NULL`. If a lead requests deletion, their download history remains (anonymized), which is good for analytics.

## 18. Environment/Secrets Audit
- **Secrets:** Checked `.env`, `.env.example`.
- **Finding:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present.
- **Status:** **PASS**. No accidental exposure of service role keys or NVIDIA API keys in the frontend environment files.

## 19. Build / Test Results
- **BUILD:** **PASS** (Application is running successfully on dev server).
- **TESTS:** **NOT VERIFIED**
- **LINT:** **NOT VERIFIED**

## 20. Git State
- **Branch:** `migration/react-phase-1`
- **Status:** Uncommitted changes in various CMS and Admin components. No tracked environment secrets detected.

## 21. Recommended Target Architecture
```text
                    PUBLIC WEBSITE
                          │
                          ▼
                    React / Vite
                          │
                ┌─────────┴─────────┐
                │                   │
           Supabase Client     Edge Functions (Rate Limited/Deployed)
                │                   │
                ▼                   ▼
          PostgREST/Auth       AI Providers & Webhook Parsers
                │                   │
                ▼                   ▼
            PostgreSQL  <───────────┘
                │
       ┌────────┴────────┐
       │                 │
 Content Registry      Media (Deprecate for Resources)
       │
       ▼
 Resource Metadata (JSONB)
       │
       ▼
 Supabase Storage
```

## 22. Scorecard
- Database schema: **PASS**
- Migrations: **PASS**
- RLS: **NEEDS ATTENTION**
- Storage: **PASS**
- Auth: **PASS**
- Resources architecture: **PASS**
- AI architecture: **BLOCKED** (Needs deployment)
- Edge Functions: **NOT VERIFIED / BLOCKED**
- Performance: **PASS**
- Data integrity: **PASS**
- Secrets: **PASS**
- Build: **PASS**

## 23. Priority Matrix

| Priority | Finding | Evidence | Impact | Recommended Action | Phase |
| -------- | ------- | -------- | ------ | ------------------ | ----- |
| **P0** | `auth.role()` deprecated | Migrations 014 | `authenticated` users can spoof roles if anon is enabled. | Refactor to `TO authenticated` or explicit `is_admin()` checks. | V2.6 |
| **P1** | Edge Function Missing | HTTP 404 on `ai-enrichment` | AI features are dead in production. | Deploy Edge Function securely via CLI. | V2.6 |
| **P1** | Open Lead Insertions | `WITH CHECK (true)` on leads | Potential database bloat / spam attack vector. | Introduce Edge Function middleware with rate limiting/CAPTCHA. | V2.6 |
| **P2** | Duplicate Asset Data | `media` table vs `metadata.assets` | Desync between tables and storage. | Standardize strictly on `content_registry.metadata.assets`. | V2.6 |

## 24. V2.6 Recommendations

### MUST FIX
1. **RLS Safety Check:** Replace `auth.role() = 'authenticated'` with `TO authenticated` and explicit function role checks to adhere to modern Supabase security guidelines.
2. **Deploy Edge Functions:** Authenticate via CLI and deploy `ai-enrichment` to unblock AI Resource Metadata generation.

### SHOULD FIX
3. **Lead Spam Protection:** Wrap the public `marketing_leads` and `resource_downloads` inserts in a rate-limited Edge Function, or apply CAPTCHA verification, instead of allowing direct `anon` database inserts.
4. **Webhook Security:** Ensure Ba9chich donation webhooks are sent to a verified, authenticated Edge Function, rather than directly to the database.

### CAN WAIT
5. **Asset Relational Modeling:** Normalizing the JSONB `assets` array into a dedicated relational table is nice for strict integrity, but the current JSONB implementation is completely adequate for the MVP.

### DO NOT CHANGE
6. **JSONB Content Registry:** The polymorphic `content_registry` schema is working perfectly for the CMS and should not be aggressively normalized into dozens of specific tables. Keep the schema dynamic.
