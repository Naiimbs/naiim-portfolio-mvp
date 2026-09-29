import { resolveMCPConnection } from './mcpConnections.js';
import { FALLBACK_AGENT_REGISTRY, sanitizeRuntimeConfig } from './agentRegistry.js';

/**
 * Server-side MCP Gateway Service (Phase 14.3).
 *
 * Implements:
 * 1. CMS-driven Agent runtime resolution (agent -> runtime_config -> mcp_connection -> connection_key).
 * 2. Dynamic server secret resolution via resolveMCPConnection(connectionKey).
 * 3. Tool allowlist enforcement & parameter mapping.
 * 4. JSON-RPC 2.0 handshake (initialize -> initialized -> tools/call).
 * 5. Structured result normalization without leaking server secrets.
 */

// In-memory tool catalog cache to avoid calling tools/list on every single query
const toolCacheMap = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Helper to execute JSON-RPC request to MCP server
 */
export async function callJsonRpc(url, token, payload, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Performs MCP handshake and queries tools/list (cached)
 */
export async function discoverMcpTools(serverUrl, token, timeoutMs = 10000) {
  const cacheKey = serverUrl;
  const cached = toolCacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.tools;
  }

  try {
    // 1. Handshake
    await callJsonRpc(
      serverUrl,
      token,
      {
        jsonrpc: '2.0',
        id: `init_${Date.now()}`,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { roots: { listChanged: false } },
          clientInfo: { name: 'naim-portfolio-gateway', version: '1.0.0' },
        },
      },
      timeoutMs
    );

    // 2. Initialized Notification
    try {
      await callJsonRpc(
        serverUrl,
        token,
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        5000
      );
    } catch {
      // Non-blocking notification
    }

    // 3. Query Tools
    const toolsResp = await callJsonRpc(
      serverUrl,
      token,
      { jsonrpc: '2.0', id: `tools_${Date.now()}`, method: 'tools/list', params: {} },
      timeoutMs
    );

    const tools = toolsResp.result?.tools || [];
    toolCacheMap.set(cacheKey, { tools, timestamp: Date.now() });
    return tools;
  } catch (err) {
    console.warn(`[MCP Gateway] Tool discovery error: ${err.message}`);
    throw err;
  }
}

/**
 * Resolves verified tool schema for a given tool name
 */
async function getVerifiedToolSchema(serverUrl, token, toolName, timeoutMs = 8000) {
  try {
    const tools = await discoverMcpTools(serverUrl, token, timeoutMs);
    const matched = tools.find((t) => t.name === toolName);
    return matched || { name: toolName };
  } catch {
    return { name: toolName };
  }
}

/**
 * Loads Agent runtime configuration from Supabase or local fallback.
 */
async function resolveAgentRuntime(slug) {
  // If Supabase environment is available server-side, query DB
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/agents?slug=eq.${encodeURIComponent(slug)}&select=id,slug,name,status,agent_runtime_configs(*,mcp_connections(*))`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0) {
          const agentRow = rows[0];
          const runtimeRow = agentRow.agent_runtime_configs?.[0] || agentRow.agent_runtime_configs;
          const connRow = runtimeRow?.mcp_connections;

          if (runtimeRow) {
            return sanitizeRuntimeConfig({
              slug: agentRow.slug,
              name: agentRow.name,
              runtime_type: runtimeRow.runtime_type,
              connection_key: connRow?.connection_key || 'n8n-main',
              allowed_tools: runtimeRow.allowed_tools,
              default_tool: runtimeRow.default_tool,
              timeout_ms: runtimeRow.timeout_ms,
              max_input_length: runtimeRow.max_input_length,
              is_enabled: runtimeRow.is_enabled && agentRow.status === 'published',
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[MCP Gateway] Supabase runtime query failed (${err.message}). Using fallback.`);
    }
  }

  // Fallback to minimal safety registry
  const fallback = FALLBACK_AGENT_REGISTRY[slug];
  return sanitizeRuntimeConfig(fallback);
}

/**
 * Executes an AI Agent demo query via CMS runtime & MCP Gateway.
 */
export async function runAgentDemo({ slug, input, toolName, context = {} }) {
  const startTime = Date.now();

  // 1. Resolve Agent Runtime from CMS
  const runtimeConfig = await resolveAgentRuntime(slug);

  if (!runtimeConfig) {
    return {
      success: false,
      status: 404,
      error: {
        code: 'AGENT_NOT_FOUND',
        message: `Agent with slug "${slug}" does not exist.`,
      },
    };
  }

  if (!runtimeConfig.enabled) {
    return {
      success: false,
      status: 403,
      error: {
        code: 'DEMO_DISABLED',
        message: `The live demo for "${runtimeConfig.name}" is currently not active. Please refer to the Case Study.`,
      },
    };
  }

  if (runtimeConfig.runtimeType !== 'mcp') {
    return {
      success: false,
      status: 400,
      error: {
        code: 'UNSUPPORTED_RUNTIME',
        message: `Interactive demo is not supported for runtime type "${runtimeConfig.runtimeType}".`,
      },
    };
  }

  // 2. Validate User Input
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return {
      success: false,
      status: 400,
      error: {
        code: 'INVALID_INPUT',
        message: 'Please enter a valid question or prompt.',
      },
    };
  }

  const cleanInput = input.trim();
  if (cleanInput.length > runtimeConfig.maxInputLength) {
    return {
      success: false,
      status: 400,
      error: {
        code: 'INPUT_TOO_LARGE',
        message: `Please enter a shorter question (maximum ${runtimeConfig.maxInputLength} characters).`,
      },
    };
  }

  // 3. Validate Tool Allowlist
  const requestedTool = toolName || runtimeConfig.defaultTool;
  if (!runtimeConfig.allowedTools.includes(requestedTool)) {
    return {
      success: false,
      status: 403,
      error: {
        code: 'TOOL_NOT_ALLOWED',
        message: 'The requested tool is not permitted for this agent.',
      },
    };
  }

  // 4. Resolve Server-Side Secrets for Connection Key
  const connection = resolveMCPConnection(runtimeConfig.connectionKey);

  if (!connection.isConfigured || !connection.serverUrl) {
    console.warn(`[MCP Gateway] Connection "${runtimeConfig.connectionKey}" is not configured on server.`);
    return {
      success: false,
      status: 503,
      error: {
        code: 'DEMO_UNAVAILABLE',
        message: 'Copilot is temporarily unavailable. Please try again later.',
      },
    };
  }

  // 5. Construct Arguments Based on Tool Schema
  const verifiedSchema = await getVerifiedToolSchema(
    connection.serverUrl,
    connection.accessToken,
    requestedTool,
    Math.min(runtimeConfig.timeoutMs, 8000)
  );

  let toolArgs = {
    prompt: cleanInput,
    query: cleanInput,
    message: cleanInput,
    input: cleanInput,
    context: context || {},
    agent: slug,
  };

  if (verifiedSchema?.inputSchema?.properties) {
    const props = verifiedSchema.inputSchema.properties;
    toolArgs = {};
    if (props.prompt) toolArgs.prompt = cleanInput;
    if (props.query) toolArgs.query = cleanInput;
    if (props.message) toolArgs.message = cleanInput;
    if (props.input) toolArgs.input = cleanInput;
    if (props.text) toolArgs.text = cleanInput;
    if (props.context) toolArgs.context = context || {};
    if (Object.keys(toolArgs).length === 0) {
      const firstProp = Object.keys(props)[0];
      if (firstProp) toolArgs[firstProp] = cleanInput;
    }
  }

  // 6. Execute JSON-RPC tools/call
  const rpcPayload = {
    jsonrpc: '2.0',
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    method: 'tools/call',
    params: {
      name: requestedTool,
      arguments: toolArgs,
    },
  };

  try {
    const responseData = await callJsonRpc(
      connection.serverUrl,
      connection.accessToken,
      rpcPayload,
      runtimeConfig.timeoutMs
    );

    if (responseData.error) {
      console.error(`[MCP Gateway] JSON-RPC error for ${slug}:`, responseData.error.message);
      return {
        success: false,
        status: 502,
        error: {
          code: 'AGENT_EXECUTION_ERROR',
          message: responseData.error.message || 'Error occurred during agent tool execution.',
        },
      };
    }

    const rawContent = responseData.result?.content || responseData.result || responseData;
    let normalizedAnswer = '';

    if (Array.isArray(rawContent)) {
      normalizedAnswer = rawContent
        .map((item) => (typeof item === 'string' ? item : item.text || JSON.stringify(item)))
        .join('\n\n');
    } else if (typeof rawContent === 'object') {
      normalizedAnswer =
        rawContent.text ||
        rawContent.output ||
        rawContent.message ||
        rawContent.response ||
        JSON.stringify(rawContent, null, 2);
    } else {
      normalizedAnswer = String(rawContent);
    }

    const durationMs = Date.now() - startTime;
    console.log(`[MCP Gateway] Success: ${slug} tool=${requestedTool} conn=${runtimeConfig.connectionKey} duration=${durationMs}ms`);

    return {
      success: true,
      status: 200,
      data: {
        agent: slug,
        tool: requestedTool,
        answer: normalizedAnswer,
        durationMs,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[MCP Gateway] Timeout exceeded (${runtimeConfig.timeoutMs}ms) for ${slug}`);
      return {
        success: false,
        status: 504,
        error: {
          code: 'TIMEOUT',
          message: 'The Copilot took too long to respond. Please try again.',
        },
      };
    }

    if (err.status === 401 || err.status === 403) {
      console.error(`[MCP Gateway] Authentication rejected for ${slug} (HTTP ${err.status})`);
      return {
        success: false,
        status: 503,
        error: {
          code: 'DEMO_UNAVAILABLE',
          message: 'Copilot is temporarily unavailable. Please try again later.',
        },
      };
    }

    console.error(`[MCP Gateway] Upstream exception for ${slug}:`, err.message);
    return {
      success: false,
      status: 503,
      error: {
        code: 'DEMO_UNAVAILABLE',
        message: 'Copilot is temporarily unavailable. Please try again later.',
      },
    };
  }
}
