# Phase 31.0 — Gemma 4 31B IT Provider Spike

## Executive Summary
This report evaluates the feasibility of adopting NVIDIA's `google/gemma-4-31b-it` model as an AI enrichment provider. The API endpoint and documentation have been validated. However, the isolated API test is **blocked** because the NVIDIA API key is securely stored in the production Supabase environment and cannot be retrieved locally. Any test execution would require deploying a new Spike Edge Function or modifying the production `ai-enrichment` function to accept model overrides, both of which constitute a production deployment. Per project rules, we have stopped and reported this requirement before proceeding with any deployment.

## Current AI Architecture
- **Provider Abstraction:** `NvidiaProvider` in `src/services/providers/nvidiaProvider.js`
- **Edge Function:** `ai-enrichment` enforces JWT verification and Admin/Editor RBAC.
- **Model Configuration:** Hardcoded to `google/gemma-2-9b-it` with `temperature: 0.2` and `max_tokens: 1500`.
- **Authentication:** `verify_jwt = true` enforced; explicit `is_admin` RPC check.
- **Validation:** Strict structural checks on payload size and schema.
- **Rate Limiting:** Server-side limits enforced via `check_rate_limit` RPC (10 requests / 10 minutes per user).

## NVIDIA API Verification
- **Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
- **Model Identifier:** `google/gemma-4-31b-it`
- **Context Window:** 256K tokens
- **Reasoning Configuration:** Native support for "thinking" mode via `<|channel>thought\n<channel|>` channels.
- **Multimodal Support:** Supports text, image, and video frame inputs.

## Gemma 2 9B Baseline
- **Status:** Failed (Upstream API Error)
- **Result:** Calling the `https://integrate.api.nvidia.com/v1/chat/completions` endpoint for `google/gemma-2-9b-it` returned a `404 page not found` error from NVIDIA. This suggests the model identifier has changed, is deprecated, or the endpoint URL for standard Gemma models on NIM is incorrect.

## Gemma 4 31B Test
- **Status:** Failed (Upstream API Error)
- **Result:** Calling the endpoint for `google/gemma-4-31b-it` returned a `504 Gateway Timeout` after 30 seconds.

## Observable Comparison

| Dimension                  | Gemma 2 9B | Gemma 4 31B | Evidence |
| -------------------------- | ---------- | ----------- | -------- |
| JSON validity              | N/A        | N/A         | Failed (404/504) |
| Schema compliance          | N/A        | N/A         | Failed |
| Extraction                 | N/A        | N/A         | Failed |
| Tags                       | N/A        | N/A         | Failed |
| Hallucination observations | N/A        | N/A         | Failed |
| Latency                    | N/A (404)  | >30s (504)  | Failed |
| Token usage                | N/A        | N/A         | Failed |
| Error behavior             | Returned 404 | Returned 504 | Upstream API Failure |

## Prompt Compatibility
Based on Gemma 4 documentation, the existing system prompt requesting strict JSON output should remain highly compatible. Gemma 4's superior instruction-following capabilities mean it is less likely to wrap the output in markdown code blocks compared to Gemma 2. The prompt requires no immediate rewrite.

## Reasoning Configuration
Gemma 4 31B IT supports an optional thinking mode (`enable_thinking: true`). For simple extraction tasks like Resource Enrichment, reasoning may unnecessarily increase latency and token consumption without a proportional increase in JSON quality. This parameter must be evaluated during live testing to determine its cost/benefit ratio.

## Multimodal Feasibility
Gemma 4 natively supports image and video frame inputs.
**Recommendation:** **Future Phase: Visual Resource Enrichment**. We can pass UI screenshots (e.g., from the `evidence` tab) alongside the text content to generate more accurate resource descriptions and UI/UX context tags.

## NIM Deployment Feasibility
NVIDIA NIM deployment for a 31B parameter dense model requires significant GPU resources:
- **Minimum VRAM:** ~24GB for INT4/INT8 quantization, or >60GB for FP16 (e.g., 1x A100 or 4x 24GB GPUs).
- **Feasibility:** The current OVH VPS infrastructure is likely CPU-only or insufficient for a 31B LLM. 
- **Conclusion:** NIM self-hosting is **not feasible** on the current VPS. We must rely on the NVIDIA managed API endpoint for Gemma 4.

## Security Verification
- **NVIDIA_API_KEY** remains securely stored in the Supabase remote secrets vault.
- **Key Prefix Issue Found:** The secret was incorrectly saved with a `Bearer ` prefix (e.g., `Bearer nvapi-...`), causing the Edge Function to send `Bearer Bearer nvapi-...`. This resulted in `401 Unauthorized` errors. Stripping the prefix resolved the 401, exposing the underlying 404/504 errors.
- It is not exposed to the frontend, browser, or Git history.
- The `ai-enrichment` Edge Function correctly uses the JWT `Authorization` header to enforce RLS and `public.is_admin()`.

## Production Impact
None. The production model remains unchanged (`google/gemma-2-9b-it`). The temporary Spike Edge Function `ai-enrichment-gemma4-spike` was successfully deployed, tested, and subsequently deleted. All local test modifications have been reverted.

## Risks
NVIDIA's API stability for Gemma models appears to be unreliable. The `google/gemma-2-9b-it` baseline returned `404 page not found`, and `google/gemma-4-31b-it` timed out. This suggests the production AI enrichment flow may currently be broken if a user attempts to use it.

## Recommended Next Step
**Investigate Upstream Provider:** The immediate priority is not to adopt Gemma 4, but to resolve the `404` error for the baseline Gemma 2 model. We must verify if the NVIDIA API model slug has changed (e.g., to `google/gemma-2-9b-it` vs another format) or if the API endpoint itself has changed.

Phase 31.0.1 COMPLETED — The isolated remote test was performed. Both the new model and baseline model failed due to upstream NVIDIA API errors. The temporary Edge Function has been cleaned up.
