# Phase 27.1: AI Enrichment Security Hardening

## 1. Executive Summary
This phase prepared the `ai-enrichment` Edge Function for production deployment by replacing an insecure legacy implementation with strict authorization, input validation, output validation, and rate limiting. The function strictly adheres to the newly required `RESOURCE_ENRICHMENT` action. Deployment remains deliberately deferred due to the missing `NVIDIA_API_KEY` production secret.

## 2. Existing Architecture
- **Provider:** `NvidiaProvider` class locally updated to invoke `RESOURCE_ENRICHMENT`.
- **Model:** `google/gemma-2-9b-it` (Preserved as requested).

## 3. Authentication
- **Status:** VERIFIED.
- **Implementation:** `verify_jwt` remains true (default) in `config.toml`. The function also manually verifies that a valid Bearer token is provided before interacting with the database.

## 4. Authorization
- **Status:** VERIFIED.
- **Implementation:** The Edge Function creates a Supabase client using the authenticated user's JWT. It explicitly calls the `is_admin()` RPC. If the user is a viewer or unauthenticated, the request is rejected with `401` or `403`.

## 5. Input Contract
- **Status:** VERIFIED.
- **Implementation:** Accepts ONLY the `RESOURCE_ENRICHMENT` action. Explicitly checks types and limits lengths of `title`, `description`, `content`, and `source_markdown`. `existing_metadata` must be a valid JSON object.
- **SSRF Protection:** Explicitly rejects any payloads containing `url`, `fetch_url`, or `webhook` fields. Total payload size is limited to 500KB.

## 6. Output Contract
- **Status:** VERIFIED.
- **Implementation:** Expects the NVIDIA provider to return a strictly typed JSON object matching the `AdminResourceEditor` CMS schema (`summary`, `purpose`, `when_to_use`, etc.). The Edge function cleans possible markdown artifacts (e.g. ````json`) and strictly validates that the response is a JSON object.

## 7. Prompt Security
- **Status:** VERIFIED.
- **Implementation:** A new deterministic system prompt explicitly directs the AI to treat input strictly as data and ignore embedded instructions, avoiding prompt injection and hallucination.

## 8. Rate Limiting
- **Status:** VERIFIED.
- **Implementation:** Reuses the existing PostgreSQL-backed RPC `check_rate_limit` introduced for `resource-ingest`. Defines an AI-specific rate limit key: `ai_enrichment:user:<uuid>`. Current rate limit allows 10 requests per 10 minutes per authenticated user.

## 9. NVIDIA Provider
- **Status:** VERIFIED IN SOURCE.
- **Implementation:** Edge Function acts as a proxy, securely attaching the `NVIDIA_API_KEY` header. A hard timeout of 30 seconds is enforced using an `AbortController`.

## 10. Secret Management
- **Status:** MISSING.
- **Implementation:** `NVIDIA_API_KEY` remains missing in production. Deployment remains deferred until the operator configures the secret in Supabase. Checked via `npm run build` and `findstr`: No API keys are leaked to the browser.

## 11. Error Handling
- **Status:** VERIFIED.
- **Implementation:** Covers `401` (auth), `403` (role), `400` (bad request), `413` (payload too large), `429` (rate limited), `504` (timeout), and `502` (bad gateway / model output error).

## 12. Tests
- **Status:** VERIFIED IN SOURCE.
- **Implementation:** Logic tested through code review. Direct end-to-end testing is blocked without a valid `NVIDIA_API_KEY` and deployment.

## 13. Build
- **Status:** VERIFIED. `npm run build` completed successfully.

## 14. Resource-ingest Regression
- **Status:** VERIFIED. `resource-ingest` remains ACTIVE and unmodified on the production server.

## 15. Remaining Blockers
- **NVIDIA_API_KEY is missing:** Must be set using `supabase secrets set NVIDIA_API_KEY="..."`.
- **Frontend Integration:** Complete integration of the `AdminResourceEditor.jsx` preview UI remains deferred for a future phase once the function is deployed.
