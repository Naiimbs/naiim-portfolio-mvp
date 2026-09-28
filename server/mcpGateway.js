import { AGENT_SERVER_REGISTRY } from './agentRegistry.js';

/**
 * Server-side MCP Gateway Service.
 *
 * Responsibilities:
 * 1. Safely resolve n8n MCP server URL and Bearer Access Token from process.env.
 * 2. Validate Agent slug, input constraints, and allowed tool allowlists.
 * 3. Enforce request timeouts (default 30s) and error containment.
 * 4. Communicate via standard JSON-RPC 2.0 protocol with the n8n MCP HTTP endpoint.
 * 5. Normalize results before returning to client.
 */

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
        message: 'Input prompt is required and must be a non-empty string.',
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
        message: `Input exceeds maximum allowed length of ${config.maxInputLength} characters.`,
      },
    };
  }

  // 3. Resolve and Validate MCP Tool
  const requestedTool = toolName || config.defaultTool;
  if (!config.allowedTools.includes(requestedTool)) {
    return {
      success: false,
      status: 403,
      error: {
        code: 'TOOL_NOT_ALLOWED',
        message: `Requested tool is not in the authorized allowlist for this agent.`,
      },
    };
  }

  // 4. Retrieve Server-Side Secrets
  const mcpServerUrl = process.env[config.mcpServerEnv];
  const mcpAccessToken = process.env[config.mcpTokenEnv];

  // If MCP server endpoint is not configured in environment, return graceful unavailable response
  if (!mcpServerUrl) {
    console.warn(`[MCP Gateway] ${config.mcpServerEnv} not configured in server environment.`);
    return {
      success: false,
      status: 503,
      error: {
        code: 'DEMO_UNAVAILABLE',
        message: 'The live agent backend is temporarily offline for maintenance. Please check back shortly.',
      },
    };
  }

  // 5. Construct JSON-RPC Payload for n8n MCP HTTP Server
  const rpcPayload = {
    jsonrpc: '2.0',
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    method: 'tools/call',
    params: {
      name: requestedTool,
      arguments: {
        prompt: cleanInput,
        query: cleanInput,
        context: context || {},
        agent: slug,
      },
    },
  };

  // 6. Execute Request with Timeout Protection
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 30000);

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (mcpAccessToken) {
      headers['Authorization'] = `Bearer ${mcpAccessToken.trim()}`;
    }

    const response = await fetch(mcpServerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(rpcPayload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[MCP Gateway] Upstream HTTP error ${response.status} from ${slug}`);
      return {
        success: false,
        status: 502,
        error: {
          code: 'UPSTREAM_ERROR',
          message: 'The AI agent backend encountered an error processing your query. Please try again.',
        },
      };
    }

    const responseData = await response.json();

    // 7. Handle JSON-RPC Errors
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

    // 8. Normalize Response
    const rawContent = responseData.result?.content || responseData.result || responseData;
    let normalizedAnswer = '';

    if (Array.isArray(rawContent)) {
      normalizedAnswer = rawContent
        .map((item) => (typeof item === 'string' ? item : item.text || JSON.stringify(item)))
        .join('\n\n');
    } else if (typeof rawContent === 'object') {
      normalizedAnswer = rawContent.text || rawContent.output || rawContent.message || JSON.stringify(rawContent, null, 2);
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
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      console.error(`[MCP Gateway] Timeout exceeded (${config.timeoutMs}ms) for ${slug}`);
      return {
        success: false,
        status: 504,
        error: {
          code: 'TIMEOUT',
          message: 'The agent response timed out. The system took longer than expected to formulate an answer.',
        },
      };
    }

    console.error(`[MCP Gateway] Network or runtime exception for ${slug}:`, err.message);
    return {
      success: false,
      status: 503,
      error: {
        code: 'DEMO_UNAVAILABLE',
        message: 'The demo gateway is temporarily unable to connect to the agent backend.',
      },
    };
  }
}
