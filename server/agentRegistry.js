/**
 * Server-side AI Agent & MCP Safety Constraints Registry.
 *
 * NOTE (Phase 14.3):
 * Agent runtime configuration is now CMS-driven via public.agent_runtime_configs
 * and public.mcp_connections in Supabase.
 *
 * This file serves as the minimal server-side safety floor:
 * - Hard ceiling constraints (max allowable limits)
 * - Supported runtime types
 * - Fallback configuration when Supabase is offline
 */

export const HARD_LIMITS = {
  MAX_INPUT_LENGTH: 4000,
  MAX_TIMEOUT_MS: 60000,
  DEFAULT_TIMEOUT_MS: 30000,
};

// Fallback runtime configs when Supabase is offline / unreachable
export const FALLBACK_AGENT_REGISTRY = {
  'naim-copilot': {
    slug: 'naim-copilot',
    name: 'Naïm Copilot',
    runtimeType: 'mcp',
    connectionKey: 'n8n-main',
    allowedTools: [
      'search_projects',
      'search_workflows',
      'search_nodes',
      'get_workflow_best_practices',
      'ask_copilot_assistant',
      'query_knowledge_base',
      'get_copilot_summary',
    ],
    defaultTool: 'search_projects',
    timeoutMs: 30000,
    maxInputLength: 1000,
    enabled: true,
  },
  'career-os': {
    slug: 'career-os',
    name: 'Career OS · Job Search Agent',
    runtimeType: 'none',
    connectionKey: null,
    allowedTools: [],
    defaultTool: null,
    timeoutMs: 30000,
    maxInputLength: 500,
    enabled: false,
  },
};

/**
 * Returns sanitized agent runtime configuration with hard safety constraints enforced.
 */
export function sanitizeRuntimeConfig(config) {
  if (!config) return null;

  return {
    slug: config.slug,
    name: config.name || config.slug,
    runtimeType: config.runtime_type || config.runtimeType || 'none',
    connectionKey: config.connection_key || config.connectionKey || 'n8n-main',
    allowedTools: Array.isArray(config.allowed_tools || config.allowedTools)
      ? (config.allowed_tools || config.allowedTools)
      : [],
    defaultTool: config.default_tool || config.defaultTool || null,
    timeoutMs: Math.min(
      Number(config.timeout_ms || config.timeoutMs) || HARD_LIMITS.DEFAULT_TIMEOUT_MS,
      HARD_LIMITS.MAX_TIMEOUT_MS
    ),
    maxInputLength: Math.min(
      Number(config.max_input_length || config.maxInputLength) || 1000,
      HARD_LIMITS.MAX_INPUT_LENGTH
    ),
    enabled: Boolean(config.is_enabled !== undefined ? config.is_enabled : config.enabled),
  };
}
