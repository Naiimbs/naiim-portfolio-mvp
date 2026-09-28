/**
 * Server-side AI Agent & MCP Integrations Registry.
 *
 * IMPORTANT SECURITY RULES:
 * - This file and its configs MUST ONLY run in server environments (Node.js/serverless).
 * - Never bundle or expose this file to client-side Vite bundles.
 * - Raw credentials and tokens are retrieved dynamically from process.env.
 */

export const AGENT_SERVER_REGISTRY = {
  'naim-copilot': {
    slug: 'naim-copilot',
    name: 'Naïm Copilot',
    enabled: true,
    mcpServerEnv: 'N8N_MCP_SERVER_URL',
    mcpTokenEnv: 'N8N_MCP_ACCESS_TOKEN',
    allowedTools: [
      'query_knowledge_base',
      'search_projects',
      'ask_copilot_assistant',
      'get_copilot_summary',
    ],
    defaultTool: 'ask_copilot_assistant',
    timeoutMs: 30000,
    maxInputLength: 1000,
    systemPrompt: 'You are Naïm Copilot, an AI product assistant answering questions about Naïm Bsili’s design, engineering, and automation background.',
  },
  'career-os': {
    slug: 'career-os',
    name: 'Career OS · Job Search Agent',
    enabled: false, // Live pipeline runs on scheduled cron; interactive demo not enabled
    mcpServerEnv: 'N8N_MCP_SERVER_URL',
    mcpTokenEnv: 'N8N_MCP_ACCESS_TOKEN',
    allowedTools: ['fetch_job_digest', 'score_job_fit'],
    defaultTool: 'fetch_job_digest',
    timeoutMs: 30000,
    maxInputLength: 500,
  },
};

/**
 * Returns safe metadata for an agent without exposing secrets.
 */
export function getAgentServerConfig(slug) {
  const config = AGENT_SERVER_REGISTRY[slug];
  if (!config) return null;

  return {
    slug: config.slug,
    name: config.name,
    enabled: config.enabled,
    allowedTools: config.allowedTools,
    timeoutMs: config.timeoutMs,
    maxInputLength: config.maxInputLength,
    isConfigured: Boolean(process.env[config.mcpServerEnv]),
  };
}
