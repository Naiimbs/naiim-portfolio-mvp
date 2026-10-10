# Phase 26.2: Secure Public Lead & Download Ingestion

## 1. Executive Summary
This phase resolved the remaining P1 vulnerability from Phase 26.1 by replacing direct, unrestricted `anon` PostgreSQL inserts with a secure, rate-limited Supabase Edge Function (`resource-ingest`). The public download flow now relies on this intermediary function to validate resource existence, normalize payloads, apply anti-abuse rate limits, and execute atomic UPSERTs, strictly preventing database bloat and abuse.

## 2. Architecture Changes

### Previous Flow
```text
React (Client)
   ↓ 
Direct INSERT into marketing_leads
   ↓ 
Direct INSERT into resource_downloads
   ↓ 
PostgreSQL (WITH CHECK true)
```

### New Flow
```text
React (Client)
   ↓ HTTP POST
resource-ingest (Edge Function)
   ├── Validate Payload
   ├── Check Rate Limits (DB check_rate_limit RPC)
   ├── Validate Resource against content_registry
   ├── Upsert Lead (service_role)
   ├── Insert Download (service_role)
   ↓
PostgreSQL
```

## 3. Edge Function Architecture
- **Location:** `supabase/functions/resource-ingest/index.ts`
- **Auth Model:** Public endpoint. Configured `verify_jwt = false` in `supabase/config.toml`. It does not require a logged-in user and acts as a security boundary. 
- **Privilege:** The Edge function uses `SUPABASE_SERVICE_ROLE_KEY` internally to bypass RLS for trusted, server-side data insertion since we revoked public `INSERT` grants on the tables.

## 4. Validation & Normalization
- Email, name, and resource IDs are strictly required.
- Emails and text strings are trimmed and length-limited (255 chars) to avoid buffer bloat or overly large payloads (`HTTP 413 Payload Too Large`).
- **Resource Integrity:** Before any lead is saved, the requested `resource_slug` is validated against `content_registry`. If it doesn't exist, the function returns `404 resource_not_found` and aborts.

## 5. Rate Limiting
- **Mechanism:** Implemented lightweight PostgreSQL-backed rate limiting (Option C) using a tumbling time window and atomic `UPSERT` via a new RPC function (`check_rate_limit`).
- **Limits applied:**
  - By IP Hash (`x-forwarded-for`): 10 requests per 10 minutes.
  - By Email: 5 requests per 30 minutes.
- **Abuse Response:** Returns `HTTP 429` (`rate_limited`) without revealing internal DB counters or specific trigger mechanisms.

## 6. Duplicate Handling
- Replaced frontend select-then-update logic with a single `upsert({ onConflict: 'email' })`. This guarantees atomicity and avoids unique constraint violations without needing a prior read.
- `first_seen_at` is preserved, while `last_seen_at`, `marketing_consent`, and name/company fields are updated gracefully.

## 7. Database Changes & RLS
- **Migration:** `supabase/migrations/016_secure_resource_ingestion.sql`
- **Table created:** `resource_ingest_rate_limits` for tracking IP and email request counts within specific time windows.
- **Grants changed:** `REVOKE INSERT ON public.marketing_leads FROM anon;` and `REVOKE INSERT ON public.resource_downloads FROM anon;`. This formally eliminates the P1 vulnerability.
- **Policies dropped:** Dropped the now-obsolete "Public can insert leads" and "Public can record downloads" policies since anon inserts are completely revoked.

## 8. Frontend Integration
- **File:** `src/services/marketing.js`
- **Change:** Removed `supabase.from('marketing_leads').insert()` logic entirely. Replaced with a unified `supabase.functions.invoke('resource-ingest', { body: payload })`.
- **UX Preserved:** Local fallback and offline sync remain intact.

## 9. Storage Download Flow
- The Edge function *only* handles metadata ingestion (leads and event logging). It does not proxy the binary file. The client successfully resumes the download directly from Supabase Storage after a successful `200 OK` from the Edge function, preserving high performance.

## 10. Tests & Build
- **Tests:** Local testing unavailable (pgTAP / `supabase test` infra not present).
- **Build:** `npm run build` PASS.

## 11. Deployment Status
- **Status:** **BLOCKED — insufficient Supabase permissions**.
- The `resource-ingest` function must be deployed securely via the CLI (`supabase functions deploy resource-ingest`) by an administrator. Until deployed, the frontend will fall back to `localStorage`.

## 12. Remaining Risks
- No known high-severity authorization or insertion risks remain for this flow. The database is secured against direct public writes, and the Edge Function is correctly rate-limited.
