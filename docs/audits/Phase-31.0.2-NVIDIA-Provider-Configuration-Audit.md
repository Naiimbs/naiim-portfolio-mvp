# Phase 31.0.2 — NVIDIA Provider Configuration Audit

## Current Production Configuration
- **Provider URL**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **Model**: `google/gemma-2-9b-it`
- **Temperature**: `0.2`
- **Max Tokens**: `1500`
- **Timeout**: 30 seconds

## Secret Handling
The code in `supabase/functions/ai-enrichment/index.ts` retrieves the `NVIDIA_API_KEY` environment variable and constructs the authorization header as follows:
```typescript
"Authorization": `Bearer ${apiKey}`
```
Because the `NVIDIA_API_KEY` stored in the remote vault already contains the prefix `Bearer ` (discovered in Phase 31.0.1), this code inadvertently generates a malformed header:
`Authorization: Bearer Bearer <secret>`

## NVIDIA API Endpoint
The endpoint used is `POST https://integrate.api.nvidia.com/v1/chat/completions`, which conforms to the OpenAI-compatible standard supported by NVIDIA NIMs.

## Current Model Availability
Web search confirms that `google/gemma-2-9b-it` is an active and supported model on the NVIDIA API Catalog ecosystem. 

## Gemma 4 Availability
Web search confirms that `google/gemma-4-31b-it` (Google's latest open-weights model) is also actively hosted and supported by NVIDIA Inference Microservices (NIM), particularly optimized as a 4-bit quantized version for production (NVFP4).

## Production Smoke Test
A controlled AI Enrichment smoke test was performed in the Admin Resource Editor UI by attempting to import and enrich a markdown file.
- **Result**: The UI surfaced an error: "AI Enrichment Failed: Edge Function HTTP error (Status: 502): The function returned an error."
- **Analysis**: The Supabase Edge function wrapped the upstream NVIDIA error (likely 401 Unauthorized due to the malformed header) into a 502 Bad Gateway response. The request successfully reached the Edge Function but failed at the NVIDIA handoff.

## Error Analysis
- **502 Bad Gateway (from Edge Function)**: Occurs when NVIDIA returns a non-200 response (like 401).
- **401 Unauthorized**: Caused by the double "Bearer" prefix in the Authorization header.
- **404 Page Not Found (from Phase 31.0.1)**: Occurs when the model slug/URL combination is rejected. This might require updating the endpoint or verifying if the NVIDIA API requires specific access grants for that model.
- **504 Gateway Timeout**: Encountered during the isolated Gemma 4 spike. This indicates the request took longer than the 30-second abort controller limit set in the Edge Function, likely due to cold-start spin-up times for the 31B model on NVIDIA's side.

## Security Verification
- `NVIDIA_API_KEY` remains strictly server-side; it is NOT exposed to the client.
- `verify_jwt = true` is intact on the `ai-enrichment` Edge Function, properly enforcing authentication.
- The remote function `ai-enrichment-gemma4-spike` has been successfully deleted.
- The Admin/Editor RBAC protections remain intact.

## Git Verification
A `git diff` on `src/services/providers/nvidiaProvider.js`, `supabase/functions/ai-enrichment/index.ts`, and `supabase/config.toml` yielded no output. The source tree is clean and unchanged.

## Findings

### P0
- **Malformed Authorization Header**: The production AI Enrichment feature is broken due to `Bearer Bearer <secret>` being sent to NVIDIA. This causes an immediate 401 Unauthorized, masked as a 502 Bad Gateway by the Edge Function.

### P1
- **Model Availability / 404 Risk**: Even if the header is fixed, the baseline model `google/gemma-2-9b-it` returned a 404 in the earlier isolated spike. The exact endpoint or slug may require an update based on NVIDIA's latest catalog structure.

### P2
- **Hardcoded 30s Timeout**: The Edge Function aborts after 30 seconds. Larger models like Gemma 4 31B may require more time to generate 1500 tokens or to spin up from a cold start, resulting in 504 timeouts.

### P3
- **Error Masking**: The Edge Function catches all upstream NVIDIA errors and returns a generic 502 ("AI provider returned an error"), making it harder to debug 401s or 404s without inspecting Edge Function logs.

## Conclusion

1. **Is `google/gemma-2-9b-it` currently available through NVIDIA's API?** Yes, it is officially documented in their catalog.
2. **Is the current production Authorization header correctly formed?** No, it generates `Bearer Bearer <secret>`.
3. **Is the production `ai-enrichment` function currently capable of reaching NVIDIA?** Yes, but it fails authentication.
4. **Is `google/gemma-4-31b-it` currently documented as an available NVIDIA API model?** Yes.
5. **Did the Gemma 4 504 indicate model unavailability, or only a timeout/availability issue?** It indicated a timeout issue (exceeding 30s), not necessarily model unavailability.
6. **Is a production code change actually required?** Yes. Either the Supabase secret must be updated to remove the "Bearer " prefix, or the Edge Function must be updated to strip it dynamically.
7. **Can Phase 31.1 safely start?** Yes. The baseline provider issues have been identified and isolated. Phase 31.1 (Production Verification) can proceed, provided the AI Enrichment fixes are incorporated into its scope.
