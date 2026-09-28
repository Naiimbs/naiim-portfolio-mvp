import { AGENT_SERVER_REGISTRY } from './agentRegistry.js';

/**
 * Server-side MCP Gateway Service.
 *
 * Implements MCP Protocol (JSON-RPC 2.0 over HTTP) with lifecycle management:
 * 1. Safe secret resolution (server-side environment variables).
 * 2. Pre-execution input validation, rate limiting & length checks.
 * 3. Protocol handshake (initialize -> initialized notification -> tools/call).
 * 4. Automatic tool schema resolution & argument mapping.
 * 5. Structured result normalization without leaking server secrets.
 */

// In-memory tool catalog cache to avoid calling tools/list on every single query
const toolCacheMap = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Helper to execute JSON-RPC request to MCP server
 */
async function callJsonRpc(url, token, payload, timeoutMs = 30000) {
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
 * Ensures MCP server handshake and retrieves available tool schema
 */
async function getVerifiedToolSchema(serverUrl, token, toolName, timeoutMs = 10000) {
  const cacheKey = `${serverUrl}::${toolName}`;
  const cached = toolCacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.schema;
  }

  try {
    // 1. Initialize MCP Session
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
        {
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        },
        5000
      );
    } catch {
      // Notification is non-blocking
    }

    // 3. Query Tools List
    const toolsResp = await callJsonRpc(
      serverUrl,
      token,
      {
        jsonrpc: '2.0',
        id: `tools_${Date.now()}`,
        method: 'tools/list',
        params: {},
      },
      timeoutMs
    );

    const tools = toolsResp.result?.tools || [];
    const matchedTool = tools.find((t) => t.name === toolName);

    if (matchedTool) {
      toolCacheMap.set(cacheKey, {
        schema: matchedTool,
        timestamp: Date.now(),
      });
      return matchedTool;
    }

    // If tools exist but the requested one is not among them, return null
    if (tools.length > 0) {
      return null;
    }

    // If tools/list returned empty, return fallback permissive schema
    return { name: toolName };
  } catch (err) {
    console.warn(`[MCP Gateway] Tool discovery skipped or failed: ${err.message}`);
    return { name: toolName };
  }
}

export async function runAgentDemo({ slug, input, toolName, context = {} }) {
  const startTime = Date.now();
  const config = AGENT_SERVER_REGISTRY[slug];

  // 1. Validate Agent Existence & Status
  if (!config) {
    return {
      success: false,
      status: 404,
      error: {
        code: 'AGENT_NOT_FOUND',
        message: `Agent with slug "${slug}" does not exist.`,
      },
    };
  }

  if (!config.enabled) {
    return {
      success: false,
      status: 403,
      error: {
        code: 'DEMO_DISABLED',
        message: `The live demo for "${config.name}" is currently not active. Please refer to the Case Study.`,
      },
    };
  }

  // 2. Validate Input
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
  if (cleanInput.length > config.maxInputLength) {
    return {
      success: false,
      status: 400,
      error: {
        code: 'INPUT_TOO_LARGE',
        message: `Please enter a shorter question (maximum ${config.maxInputLength} characters).`,
      },
    };
  }

  // 3. Resolve and Validate Tool Allowlist
  const requestedTool = toolName || config.defaultTool;
  if (!config.allowedTools.includes(requestedTool)) {
    return {
      success: false,
      status: 403,
      error: {
        code: 'TOOL_NOT_ALLOWED',
        message: 'The requested tool is not permitted for this agent.',
      },
    };
  }

  // 4. Retrieve Server-Side Secrets
  const mcpServerUrl = process.env[config.mcpServerEnv];
  const mcpAccessToken = process.env[config.mcpTokenEnv];

  if (!mcpServerUrl) {
    console.warn(`[MCP Gateway] ${config.mcpServerEnv} not configured in server environment.`);
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
    mcpServerUrl,
    mcpAccessToken,
    requestedTool,
    Math.min(config.timeoutMs, 8000)
  );

  let toolArgs = {
    prompt: cleanInput,
    query: cleanInput,
    message: cleanInput,
    input: cleanInput,
    context: context || {},
    agent: slug,
  };

  // If schema strictly defines properties, align keys
  if (verifiedSchema?.inputSchema?.properties) {
    const props = verifiedSchema.inputSchema.properties;
    toolArgs = {};
    if (props.prompt) toolArgs.prompt = cleanInput;
    if (props.query) toolArgs.query = cleanInput;
    if (props.message) toolArgs.message = cleanInput;
    if (props.input) toolArgs.input = cleanInput;
    if (props.text) toolArgs.text = cleanInput;
    if (props.context) toolArgs.context = context || {};
    // Ensure at least one argument holds the query
    if (Object.keys(toolArgs).length === 0) {
      const firstProp = Object.keys(props)[0];
      if (firstProp) toolArgs[firstProp] = cleanInput;
    }
  }

  // 6. Build tools/call JSON-RPC Payload
  const rpcPayload = {
    jsonrpc: '2.0',
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    method: 'tools/call',
    params: {
      name: requestedTool,
      arguments: toolArgs,
    },
  };

  // 7. Execute Request with Timeout Protection
  try {
    const responseData = await callJsonRpc(
      mcpServerUrl,
      mcpAccessToken,
      rpcPayload,
      config.timeoutMs || 30000
    );

    // 8. Handle JSON-RPC Errors
    if (responseData.error) {
      console.error(`[MCP Gateway] JSON-RPC error from ${slug}:`, responseData.error.message);
      return {
        success: false,
        status: 502,
        error: {
          code: 'AGENT_EXECUTION_ERROR',
          message: responseData.error.message || 'Error occurred during agent tool execution.',
        },
      };
    }

    // 9. Normalize Response
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
    console.log(`[MCP Gateway] Success: ${slug} tool=${requestedTool} duration=${durationMs}ms`);

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
      console.error(`[MCP Gateway] Timeout exceeded (${config.timeoutMs}ms) for ${slug}`);
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
      console.error(`[MCP Gateway] Authentication failed for ${slug} (HTTP ${err.status})`);
      return {
        success: false,
        status: 503,
        error: {
          code: 'DEMO_UNAVAILABLE',
          message: 'Copilot is temporarily unavailable. Please try again later.',
        },
      };
    }

    console.error(`[MCP Gateway] Upstream error for ${slug}:`, err.message);
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
