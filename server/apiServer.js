import http from 'node:http';
import { runAgentDemo, discoverMcpTools, callJsonRpc } from './mcpGateway.js';
import {
  resolveMCPConnection,
  getSafeConnectionInfo,
  saveMCPConnectionSecrets,
  createOAuthState,
  validateAndConsumeOAuthState,
  exchangeOAuthCode,
  listMCPConnections,
  saveMCPConnectionRecord,
  deleteMCPConnectionRecord,
} from './mcpConnections.js';
import { FALLBACK_AGENT_REGISTRY } from './agentRegistry.js';

const PORT = process.env.PORT || process.env.API_PORT || 3001;

// Simple In-Memory Rate Limiter (Sliding Window per IP)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests/min
const ipRequestMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = ipRequestMap.get(ip) || [];
  const recent = timestamps.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestMap.set(ip, recent);
    return true;
  }

  recent.push(now);
  ipRequestMap.set(ip, recent);
  return false;
}

// Cleanup stale IP entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequestMap.entries()) {
    const recent = timestamps.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      ipRequestMap.delete(ip);
    } else {
      ipRequestMap.set(ip, recent);
    }
  }
}, 5 * 60 * 1000);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store, max-age=0',
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store, max-age=0',
  });
  res.end(html);
}

/**
 * Helper to safely read request body as JSON
 */
function parseRequestBody(req, maxBytes = 50 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > maxBytes) {
        req.destroy();
        reject(new Error('PAYLOAD_TOO_LARGE'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Executes a controlled runtime console command.
 */
async function executeConsoleCommand(rawCmd) {
  const trimmed = (rawCmd || '').trim();
  if (!trimmed) {
    return { output: 'Please enter a command. Type "help" to see available commands.' };
  }

  const parts = trimmed.split(/\s+/);
  const main = parts[0].toLowerCase();
  const sub = parts[1] ? parts[1].toLowerCase() : null;
  const target = parts[2] ? parts[2].toLowerCase() : null;

  // 1. HELP
  if (main === 'help') {
    return {
      output: [
        'Available Runtime Commands:',
        '  help                 Show this help overview',
        '  status               Show portfolio & runtime health',
        '  mcp status           Inspect active MCP connection status',
        '  mcp tools            Discover available tools from active MCP server',
        '  mcp test             Execute handshake & health check on active MCP connection',
        '  agent list           List all registered AI Agents and demo status',
        '  agent inspect <slug> View runtime configuration for a specific agent',
        '  agent tools <slug>   List authorized tools for an agent',
        '  agent test <slug>    Execute a live diagnostic query through the agent runtime',
        '  clear                Clear the console screen',
      ].join('\n'),
    };
  }

  // 2. STATUS
  if (main === 'status') {
    const connInfo = await getSafeConnectionInfo('n8n-main');
    return {
      output: [
        'Portfolio API',
        '  ✓ Service: portfolio-api',
        '  ✓ Status: Online',
        `  Primary MCP Key: n8n-main`,
        `  MCP Secret: ${connInfo.isConfigured ? 'Configured (Server-Side)' : 'Not Configured (Missing in .env)'}`,
        `  MCP Host: ${connInfo.host || 'N/A'}`,
        `  Timestamp: ${new Date().toISOString()}`,
      ].join('\n'),
    };
  }

  // 3. MCP COMMANDS (mcp status | mcp tools | mcp test)
  if (main === 'mcp') {
    const connKey = target || (sub === 'status' || sub === 'tools' || sub === 'test' ? 'n8n-main' : sub || 'n8n-main');
    const resolved = await resolveMCPConnection(connKey);
    const connInfo = await getSafeConnectionInfo(connKey);

    if (sub === 'status') {
      return {
        output: [
          `MCP Connection [${connKey}]:`,
          `  Status: ${resolved.isConfigured ? 'Configured' : 'Not Configured'}`,
          `  Host: ${connInfo.host || 'None (configure N8N_MCP_SERVER_URL in .env)'}`,
          `  Token: ${connInfo.hasToken ? 'Masked / Server-Side' : 'Missing'}`,
        ].join('\n'),
      };
    }

    if (sub === 'tools') {
      if (!resolved.isConfigured || !resolved.serverUrl) {
        return {
          output: `MCP server is not configured.\nConfigure N8N_MCP_SERVER_URL and N8N_MCP_ACCESS_TOKEN in server .env first.`,
        };
      }
      try {
        const tools = await discoverMcpTools(resolved.serverUrl, resolved.accessToken, 10000);
        if (tools.length === 0) {
          return { output: `Connected to MCP server, but 0 tools were returned by tools/list.` };
        }
        const lines = [`Discovered Tools (${tools.length}):`];
        tools.forEach((t) => {
          lines.push(`  ✓ ${t.name}${t.description ? ` — ${t.description}` : ''}`);
        });
        return { output: lines.join('\n') };
      } catch (err) {
        return { output: `MCP tool discovery failed: ${err.message}` };
      }
    }

    if (sub === 'test') {
      if (!resolved.isConfigured || !resolved.serverUrl) {
        return {
          output: `MCP connection test failed: Server-side credentials not found in .env.`,
        };
      }
      try {
        const tools = await discoverMcpTools(resolved.serverUrl, resolved.accessToken, 10000);
        return {
          output: [
            `✓ MCP Connection [${connKey}] verified:`,
            `  HTTP Handshake: Success (initialize -> initialized)`,
            `  Host: ${connInfo.host}`,
            `  Tools Discovered: ${tools.length}`,
            `  Status: 🟢 Connected & Healthy`,
          ].join('\n'),
        };
      } catch (err) {
        return { output: `✕ MCP Connection test failed: ${err.message}` };
      }
    }

    return { output: `Unknown MCP subcommand "${sub}". Type "help" for syntax.` };
  }

  // 4. AGENT COMMANDS (agent list | agent inspect <slug> | agent tools <slug> | agent test <slug>)
  if (main === 'agent') {
    if (sub === 'list') {
      const slugs = Object.keys(FALLBACK_AGENT_REGISTRY);
      const lines = ['Registered Agents:'];
      slugs.forEach((slug) => {
        const ag = FALLBACK_AGENT_REGISTRY[slug];
        lines.push(`  • ${ag.name} (${slug})`);
        lines.push(`    Runtime: ${ag.runtimeType} | Enabled: ${ag.enabled ? 'YES' : 'NO'} | Default Tool: ${ag.defaultTool || 'none'}`);
      });
      return { output: lines.join('\n') };
    }

    const agentSlug = parts[2] || (sub !== 'list' && sub !== 'help' ? sub : null);
    if (!agentSlug) {
      return { output: 'Please specify an agent slug. Example: `agent inspect naim-copilot`' };
    }

    if (sub === 'inspect') {
      const ag = FALLBACK_AGENT_REGISTRY[agentSlug];
      if (!ag) return { output: `Agent "${agentSlug}" not found in registry.` };
      return {
        output: [
          `Agent: ${ag.name} [${ag.slug}]`,
          `  Runtime: ${ag.runtimeType}`,
          `  Connection Key: ${ag.connectionKey || 'None'}`,
          `  Default Tool: ${ag.defaultTool || 'None'}`,
          `  Allowed Tools (${ag.allowedTools.length}): ${ag.allowedTools.join(', ') || 'None'}`,
          `  Timeout: ${ag.timeoutMs}ms`,
          `  Max Input: ${ag.maxInputLength} chars`,
          `  Execution Enabled: ${ag.enabled ? 'YES' : 'NO'}`,
        ].join('\n'),
      };
    }

    if (sub === 'tools') {
      const ag = FALLBACK_AGENT_REGISTRY[agentSlug];
      if (!ag) return { output: `Agent "${agentSlug}" not found.` };
      if (ag.allowedTools.length === 0) {
        return { output: `Agent "${ag.name}" has 0 allowed tools configured.` };
      }
      return {
        output: [
          `Allowed Tools for "${ag.name}":`,
          ...ag.allowedTools.map((t) => `  ✓ ${t}${t === ag.defaultTool ? ' (DEFAULT)' : ''}`),
        ].join('\n'),
      };
    }

    if (sub === 'test') {
      const testPrompt = 'Give me a short summary of what this agent can do.';
      const trace = [
        `[${new Date().toLocaleTimeString()}] Initiating test for agent: ${agentSlug}`,
        `[${new Date().toLocaleTimeString()}] Resolving runtime configuration...`,
      ];

      const result = await runAgentDemo({
        slug: agentSlug,
        input: testPrompt,
      });

      if (!result.success) {
        trace.push(`[${new Date().toLocaleTimeString()}] ✕ Execution failed: ${result.error?.message || 'Unknown error'}`);
        trace.push(`[${new Date().toLocaleTimeString()}] Status: ${result.status || 500} (${result.error?.code || 'ERROR'})`);
        return { output: trace.join('\n') };
      }

      trace.push(`[${new Date().toLocaleTimeString()}] ✓ Tool executed: ${result.data?.tool}`);
      trace.push(`[${new Date().toLocaleTimeString()}] ✓ Response duration: ${result.data?.durationMs}ms`);
      trace.push(`\nResponse:\n${result.data?.answer}`);
      return { output: trace.join('\n') };
    }

    return { output: `Unknown agent subcommand "${sub}". Type "help" for syntax.` };
  }

  // 5. CLEAR (Handled on client side)
  if (main === 'clear') {
    return { output: '', clear: true };
  }

  return {
    output: `Unknown command "${trimmed}".\nType "help" to see all available commands.`,
  };
}

/**
 * Main API Request Dispatcher.
 * Async handler supporting both Node standalone server and Vite middleware.
 */
export async function handleApiRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // 1. Health check: GET /api/health
  if (method === 'GET' && pathname === '/api/health') {
    const resolved = await resolveMCPConnection('n8n-main');
    sendJson(res, 200, {
      ok: true,
      service: 'portfolio-api',
      mcpConfigured: resolved.isConfigured,
      time: new Date().toISOString(),
    });
    return true;
  }

  // MCP Connections Persistence & Listing
  // GET /api/admin/mcp-connections
  if (method === 'GET' && pathname === '/api/admin/mcp-connections') {
    const list = listMCPConnections();
    sendJson(res, 200, { ok: true, success: true, data: list });
    return true;
  }

  // POST /api/admin/mcp-connections
  if (method === 'POST' && pathname === '/api/admin/mcp-connections') {
    try {
      const body = await parseRequestBody(req, 20 * 1024);
      const saved = saveMCPConnectionRecord(body);
      sendJson(res, 200, { ok: true, success: true, data: saved });
    } catch (err) {
      sendJson(res, 400, { ok: false, success: false, error: { message: err.message } });
    }
    return true;
  }

  // GET /api/admin/mcp-connections/:key or DELETE /api/admin/mcp-connections/:key
  const singleConnMatch = pathname.match(/^\/api\/admin\/mcp-connections\/([a-zA-Z0-9_-]+)$/);
  if (singleConnMatch) {
    const connKey = singleConnMatch[1];
    if (method === 'GET') {
      const list = listMCPConnections();
      const found = list.find((c) => c.slug === connKey || c.connection_key === connKey || c.id === connKey);
      if (found) {
        sendJson(res, 200, { ok: true, success: true, data: found });
      } else {
        sendJson(res, 404, { ok: false, success: false, error: { message: 'Connection not found' } });
      }
      return true;
    }
    if (method === 'DELETE') {
      deleteMCPConnectionRecord(connKey);
      sendJson(res, 200, { ok: true, success: true });
      return true;
    }
  }

  // 2. Admin Diagnostic: Test MCP Connection
  // POST /api/admin/mcp-connections/:key/test
  const testMatch = pathname.match(/^\/api\/admin\/mcp-connections\/([a-zA-Z0-9_-]+)\/test$/);
  if (method === 'POST' && testMatch) {
    const connKey = testMatch[1];
    let candidateData = {};
    try {
      candidateData = await parseRequestBody(req, 20 * 1024);
    } catch {
      // Body is optional
    }

    const resolved = await resolveMCPConnection(connKey);
    const targetUrl = (candidateData.serverUrl !== undefined ? candidateData.serverUrl : (resolved.serverUrl || '')).trim();
    const targetToken = candidateData.accessToken !== undefined ? candidateData.accessToken : resolved.accessToken;

    if (!targetUrl) {
      sendJson(res, 200, {
        ok: false,
        success: false,
        status: 'not_configured',
        error: {
          code: 'MCP_NOT_CONFIGURED',
          message: 'MCP server URL is not configured.',
          reason: 'MCP server URL has not been configured yet.',
        },
      });
      return true;
    }

    // Validate URL syntax
    try {
      const parsed = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      sendJson(res, 200, {
        ok: false,
        success: false,
        status: 'unavailable',
        error: {
          code: 'INVALID_URL',
          message: "We couldn't connect to this MCP server.",
          reason: 'Invalid URL. Please enter a valid HTTP or HTTPS endpoint.',
        },
      });
      return true;
    }

    const startTime = Date.now();

    try {
      // 1. Handshake (initialize)
      const initRes = await callJsonRpc(
        targetUrl,
        targetToken,
        {
          jsonrpc: '2.0',
          id: `init_test_${Date.now()}`,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { roots: { listChanged: false } },
            clientInfo: { name: 'naim-portfolio-gateway', version: '1.0.0' },
          },
        },
        10000
      );

      // 2. Initialized Notification (best-effort)
      try {
        await callJsonRpc(
          targetUrl,
          targetToken,
          { jsonrpc: '2.0', method: 'notifications/initialized' },
          4000
        );
      } catch {
        // Non-blocking notification
      }

      // 3. Tool Discovery (tools/list)
      const tools = await discoverMcpTools(targetUrl, targetToken, 10000);
      const latencyMs = Date.now() - startTime;

      sendJson(res, 200, {
        ok: true,
        success: true,
        connection: connKey,
        status: 'connected',
        serverUrl: targetUrl,
        serverInfo: initRes?.result?.serverInfo || { name: 'n8n-mcp-server', version: '1.0.0' },
        protocolVersion: initRes?.result?.protocolVersion || '2024-11-05',
        latencyMs,
        toolsCount: tools.length,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description || '',
          category: t.category || '',
          parameters: t.inputSchema?.properties ? Object.keys(t.inputSchema.properties) : [],
          inputSchema: t.inputSchema || {},
        })),
      });
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      let safeReason = 'MCP initialization failed';
      const msg = (err.message || '').toLowerCase();

      if (err.status === 401 || err.status === 403 || msg.includes('401') || msg.includes('unauthorized')) {
        safeReason = 'Authentication failed. Please verify your Access Token.';
      } else if (err.code === 'ENOTFOUND' || msg.includes('enotfound') || msg.includes('fetch failed')) {
        safeReason = 'Server unreachable. Please verify the URL is correct and active.';
      } else if (err.name === 'AbortError' || msg.includes('timeout') || msg.includes('abort')) {
        safeReason = 'Timeout. The MCP server took too long to respond.';
      } else if (msg.includes('json') || msg.includes('syntax')) {
        safeReason = 'Invalid MCP response received from server.';
      } else if (err.message) {
        safeReason = err.message;
      }

      sendJson(res, 200, {
        ok: false,
        success: false,
        status: 'unavailable',
        latencyMs,
        error: {
          code: 'MCP_CONNECTION_FAILED',
          message: "We couldn't connect to this MCP server.",
          reason: safeReason,
        },
      });
    }
    return true;
  }

  // 3. Admin Tool Discovery: POST /api/admin/mcp-connections/:key/discover
  const discoverMatch = pathname.match(/^\/api\/admin\/mcp-connections\/([a-zA-Z0-9_-]+)\/discover$/);
  if (method === 'POST' && discoverMatch) {
    const connKey = discoverMatch[1];
    let candidateData = {};
    try {
      candidateData = await parseRequestBody(req, 20 * 1024);
    } catch {
      // Body is optional
    }

    const resolved = await resolveMCPConnection(connKey);
    const targetUrl = (candidateData.serverUrl || resolved.serverUrl || '').trim();
    const targetToken = candidateData.accessToken !== undefined ? candidateData.accessToken : resolved.accessToken;

    if (!targetUrl) {
      sendJson(res, 200, {
        ok: false,
        success: false,
        status: 'not_configured',
        error: {
          code: 'MCP_NOT_CONFIGURED',
          message: "We couldn't connect to this MCP server.",
          reason: 'MCP server credentials are not configured.',
        },
      });
      return true;
    }

    try {
      const tools = await discoverMcpTools(targetUrl, targetToken, 10000);
      sendJson(res, 200, {
        ok: true,
        success: true,
        connection: connKey,
        status: 'connected',
        toolsCount: tools.length,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description || '',
          category: t.category || '',
          parameters: t.inputSchema?.properties ? Object.keys(t.inputSchema.properties) : [],
          inputSchema: t.inputSchema || {},
        })),
      });
    } catch (err) {
      let safeReason = 'MCP tool discovery failed';
      const msg = (err.message || '').toLowerCase();
      if (err.status === 401 || err.status === 403 || msg.includes('401') || msg.includes('unauthorized')) {
        safeReason = 'Authentication failed. Please verify your Access Token.';
      } else if (err.code === 'ENOTFOUND' || msg.includes('enotfound') || msg.includes('fetch failed')) {
        safeReason = 'Server unreachable. Please verify the URL.';
      } else if (err.name === 'AbortError' || msg.includes('timeout')) {
        safeReason = 'Timeout discovering tools.';
      }

      sendJson(res, 200, {
        ok: false,
        success: false,
        status: 'unavailable',
        error: {
          code: 'MCP_DISCOVERY_FAILED',
          message: "We couldn't connect to this MCP server.",
          reason: safeReason,
        },
      });
    }
    return true;
  }

  // 4. Safe Diagnostic Info Endpoint: GET /api/admin/mcp-connections/:key/info
  const infoMatch = pathname.match(/^\/api\/admin\/mcp-connections\/([a-zA-Z0-9_-]+)\/info$/);
  if (method === 'GET' && infoMatch) {
    const connKey = infoMatch[1];
    const safeInfo = await getSafeConnectionInfo(connKey);
    sendJson(res, 200, {
      ok: true,
      success: true,
      data: safeInfo,
    });
    return true;
  }

  // 5. Secure Server-Side Credentials Persistence
  // POST /api/admin/mcp-connections/:key/credentials
  const credsMatch = pathname.match(/^\/api\/admin\/mcp-connections\/([a-zA-Z0-9_-]+)\/credentials$/);
  if (method === 'POST' && credsMatch) {
    const connKey = credsMatch[1];
    try {
      const body = await parseRequestBody(req, 10 * 1024);
      saveMCPConnectionSecrets(connKey, {
        serverUrl: body.serverUrl,
        accessToken: body.accessToken,
        authType: body.authType,
        clientId: body.clientId,
        clientSecret: body.clientSecret,
        authorizationUrl: body.authorizationUrl,
        tokenUrl: body.tokenUrl,
        scopes: body.scopes,
        redirectUri: body.redirectUri,
        refreshToken: body.refreshToken,
        expiresAt: body.expiresAt,
      });

      sendJson(res, 200, {
        ok: true,
        success: true,
        connection: connKey,
      });
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        success: false,
        error: { code: 'SAVE_FAILED', message: err.message },
      });
    }
    return true;
  }

  // 6. OAuth Authorization URL Generator: POST /api/admin/mcp-connections/:key/oauth/authorize
  const oauthAuthMatch = pathname.match(/^\/api\/admin\/mcp-connections\/([a-zA-Z0-9_-]+)\/oauth\/authorize$/);
  if (method === 'POST' && oauthAuthMatch) {
    const connKey = oauthAuthMatch[1];
    try {
      const body = await parseRequestBody(req, 10 * 1024);
      const resolved = await resolveMCPConnection(connKey);

      const authUrl = (body.authorizationUrl || resolved.authorizationUrl || '').trim();
      const clientId = (body.clientId || resolved.clientId || '').trim();
      const scopes = (body.scopes || resolved.scopes || '').trim();
      const redirectUri = (
        body.redirectUri ||
        resolved.redirectUri ||
        `http://${req.headers.host || 'localhost:5173'}/api/oauth/callback`
      ).trim();

      if (!authUrl) {
        sendJson(res, 400, {
          error: true,
          code: 'OAUTH_START_FAILED',
          message: 'Authorization URL is required for OAuth 2.0.',
          ok: false,
          success: false,
        });
        return true;
      }

      if (!clientId) {
        sendJson(res, 400, {
          error: true,
          code: 'OAUTH_START_FAILED',
          message: 'Client ID is required for OAuth 2.0.',
          ok: false,
          success: false,
        });
        return true;
      }

      // Generate CSRF-protected state
      const state = createOAuthState(connKey, redirectUri);

      // Build secure authorization URL
      let authObj;
      try {
        authObj = new URL(authUrl);
      } catch {
        sendJson(res, 400, {
          error: true,
          code: 'OAUTH_START_FAILED',
          message: 'Invalid Authorization URL. Please provide a valid HTTP or HTTPS endpoint.',
          ok: false,
          success: false,
        });
        return true;
      }

      authObj.searchParams.set('response_type', 'code');
      authObj.searchParams.set('client_id', clientId);
      authObj.searchParams.set('redirect_uri', redirectUri);
      authObj.searchParams.set('state', state);
      authObj.searchParams.set('access_type', 'offline');
      authObj.searchParams.set('prompt', 'consent');
      if (scopes) {
        authObj.searchParams.set('scope', scopes);
      }

      sendJson(res, 200, {
        ok: true,
        success: true,
        state,
        redirectUri,
        authorizeUrl: authObj.toString(),
      });
    } catch (err) {
      sendJson(res, 400, {
        error: true,
        code: 'OAUTH_START_FAILED',
        message: err.message || 'OAuth authorization initiation failed.',
        ok: false,
        success: false,
      });
    }
    return true;
  }

  // 7. OAuth Callback: GET /api/oauth/callback
  if (method === 'GET' && (pathname === '/api/oauth/callback' || pathname === '/api/admin/mcp-connections/oauth/callback')) {
    const code = parsedUrl.searchParams.get('code');
    const state = parsedUrl.searchParams.get('state');
    const error = parsedUrl.searchParams.get('error');
    const errorDesc = parsedUrl.searchParams.get('error_description');

    if (error) {
      sendHtml(
        res,
        400,
        `<!DOCTYPE html><html><head><title>OAuth Authorization Failed</title></head>
        <body style="font-family:sans-serif;padding:50px;text-align:center;background:#fff;color:#212529;">
          <h2 style="color:#dc3545;margin-bottom:12px;">OAuth Authorization Failed</h2>
          <p style="color:#6c757d;margin-bottom:24px;">${errorDesc || error}</p>
          <p><a href="/admin/mcp-connections" style="color:#0d6efd;text-decoration:none;font-weight:bold;">Return to MCP Connections</a></p>
        </body></html>`
      );
      return true;
    }

    if (!state || !code) {
      sendHtml(
        res,
        400,
        `<!DOCTYPE html><html><head><title>Invalid Callback</title></head>
        <body style="font-family:sans-serif;padding:50px;text-align:center;background:#fff;color:#212529;">
          <h2 style="color:#dc3545;margin-bottom:12px;">Invalid OAuth Callback</h2>
          <p style="color:#6c757d;margin-bottom:24px;">Missing authorization code or state token.</p>
          <p><a href="/admin/mcp-connections" style="color:#0d6efd;text-decoration:none;font-weight:bold;">Return to MCP Connections</a></p>
        </body></html>`
      );
      return true;
    }

    const stateData = validateAndConsumeOAuthState(state);
    if (!stateData) {
      sendHtml(
        res,
        400,
        `<!DOCTYPE html><html><head><title>State Validation Failed</title></head>
        <body style="font-family:sans-serif;padding:50px;text-align:center;background:#fff;color:#212529;">
          <h2 style="color:#dc3545;margin-bottom:12px;">State Validation Failed</h2>
          <p style="color:#6c757d;margin-bottom:24px;">The OAuth state token is invalid or expired. Please re-initiate the OAuth connection.</p>
          <p><a href="/admin/mcp-connections" style="color:#0d6efd;text-decoration:none;font-weight:bold;">Return to MCP Connections</a></p>
        </body></html>`
      );
      return true;
    }

    const { connectionKey, redirectUri } = stateData;

    try {
      await exchangeOAuthCode({ connectionKey, code, redirectUri });

      sendHtml(
        res,
        200,
        `<!DOCTYPE html><html><head><title>OAuth Connected</title></head>
        <body style="font-family:sans-serif;padding:50px;text-align:center;background:#f8f9fa;color:#212529;">
          <h2 style="color:#198754;margin-bottom:12px;">✓ OAuth Connected Successfully</h2>
          <p style="color:#495057;margin-bottom:20px;">Connection <strong>${connectionKey}</strong> is now securely authenticated.</p>
          <p style="color:#6c757d;font-size:14px;">Returning to Admin CMS...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'MCP_OAUTH_SUCCESS', connectionKey: '${connectionKey}' }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                setTimeout(() => { window.location.href = '/admin/mcp-connections?oauth_status=success&conn=${connectionKey}'; }, 1200);
              }
            } catch (e) {
              window.location.href = '/admin/mcp-connections?oauth_status=success&conn=${connectionKey}';
            }
          </script>
        </body></html>`
      );
    } catch (err) {
      sendHtml(
        res,
        500,
        `<!DOCTYPE html><html><head><title>Token Exchange Failed</title></head>
        <body style="font-family:sans-serif;padding:50px;text-align:center;background:#fff;color:#212529;">
          <h2 style="color:#dc3545;margin-bottom:12px;">OAuth Token Exchange Failed</h2>
          <p style="color:#6c757d;margin-bottom:24px;">${err.message}</p>
          <p><a href="/admin/mcp-connections" style="color:#0d6efd;text-decoration:none;font-weight:bold;">Return to MCP Connections</a></p>
        </body></html>`
      );
    }
    return true;
  }


  // 4. Admin Runtime Console: POST /api/admin/runtime-console
  if (method === 'POST' && pathname === '/api/admin/runtime-console') {
    try {
      const body = await parseRequestBody(req, 10 * 1024);
      const cmd = body.command || '';
      const resData = await executeConsoleCommand(cmd);
      sendJson(res, 200, { ok: true, success: true, ...resData });
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        success: false,
        error: { code: 'INVALID_COMMAND', message: err.message },
      });
    }
    return true;
  }

  // 5. Agent Execution: POST /api/agents/:slug/run
  const runMatch = pathname.match(/^\/api\/agents\/([a-zA-Z0-9_-]+)\/run$/);
  if (method === 'POST' && runMatch) {
    const slug = runMatch[1];
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    if (isRateLimited(clientIp)) {
      sendJson(res, 429, {
        ok: false,
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a minute before running the agent again.',
        },
      });
      return true;
    }

    try {
      const body = await parseRequestBody(req, 50 * 1024);
      const input = body.input || body.prompt || body.message;
      const toolName = body.tool || body.toolName;
      const context = body.context || {};

      const result = await runAgentDemo({
        slug,
        input,
        toolName,
        context,
      });

      sendJson(res, result.status || (result.success ? 200 : 500), {
        ok: result.success,
        ...result,
      });
    } catch (parseErr) {
      sendJson(res, 400, {
        ok: false,
        success: false,
        error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' },
      });
    }
    return true;
  }

  // 6. Default 404 for unhandled /api/ routes
  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, {
      ok: false,
      success: false,
      error: { code: 'ROUTE_NOT_FOUND', message: 'API route not found.' },
    });
    return true;
  }

  return false;
}

// Standalone Server runner (if executed via `node server/apiServer.js`)
if (process.argv[1] && process.argv[1].endsWith('apiServer.js')) {
  const server = http.createServer(async (req, res) => {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`[MCP Demo API Server] Running on http://localhost:${PORT}`);
  });
}
