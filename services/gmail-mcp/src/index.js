import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { validateMcpAuth } from './auth.js';
import { handleMcpJsonRpc } from './mcpHandler.js';
import { checkGmailConnection } from './gmailClient.js';
import {
  ensureEnvLoaded,
  validateClientCredentials,
  validateOAuthConfig,
  generateGoogleAuthUrl,
  exchangeCodeForTokens,
  saveRefreshToken,
  GMAIL_SCOPES,
} from './googleAuth.js';
import {
  createOAuthState,
  validateAndConsumeOAuthState,
} from './oauthState.js';

const PORT = parseInt(process.env.PORT || '3100', 10);
const HOST = process.env.HOST || '0.0.0.0';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely parses request JSON body with a maximum byte limit.
 */
function parseRequestBody(req, maxBytes = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let bytes = 0;

    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error('Payload Too Large'));
        req.destroy();
        return;
      }
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve(null);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch (err) {
        const parseErr = new Error('Parse error');
        parseErr.isParseError = true;
        reject(parseErr);
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

export const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = (req.method || 'GET').toUpperCase();

  // 1. Unauthenticated Health Check: GET /health (Fast & Deterministic)
  if (method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'gmail-mcp',
      version: '0.1.0',
    });
  }

  // 2. Authenticated Gmail Diagnostic Health Check: GET /health/gmail
  if (method === 'GET' && pathname === '/health/gmail') {
    const authResult = validateMcpAuth(req);
    if (!authResult.authenticated) {
      return sendJson(res, authResult.statusCode || 401, {
        error: authResult.error || { code: 'UNAUTHORIZED', message: 'Invalid MCP credentials' },
      });
    }

    try {
      await checkGmailConnection();
      return sendJson(res, 200, {
        ok: true,
        gmail: 'connected',
      });
    } catch (err) {
      const code = err.code || 'GMAIL_API_ERROR';
      return sendJson(res, 503, {
        ok: false,
        gmail: 'disconnected',
        error: {
          code,
          message: err.message,
        },
      });
    }
  }

  // 3. OAuth Status Endpoint: GET /oauth/status
  if (method === 'GET' && pathname === '/oauth/status') {
    const oauthConfig = validateOAuthConfig();
    return sendJson(res, 200, {
      configured: Boolean(oauthConfig.clientId && oauthConfig.clientSecret),
      authenticated: Boolean(oauthConfig.hasRefreshToken),
      scopes: GMAIL_SCOPES,
    });
  }

  // 4. OAuth Start Endpoint: GET /oauth/google/start
  if (method === 'GET' && pathname === '/oauth/google/start') {
    const creds = validateClientCredentials();
    if (!creds.configured) {
      return sendJson(res, 400, {
        ok: false,
        error: {
          code: 'GMAIL_OAUTH_NOT_CONFIGURED',
          message: `Google OAuth Client credentials not configured on the Gmail MCP server. Missing: ${creds.missing.join(', ')}.`,
        },
      });
    }

    const state = createOAuthState();
    try {
      const authUrl = generateGoogleAuthUrl(state);
      res.writeHead(302, {
        Location: authUrl,
        'Cache-Control': 'no-store, no-cache',
      });
      return res.end();
    } catch (err) {
      return sendJson(res, 500, {
        ok: false,
        error: {
          code: err.code || 'GMAIL_OAUTH_FAILED',
          message: err.message,
        },
      });
    }
  }

  // 5. OAuth Callback Endpoint: GET /oauth/google/callback
  if (method === 'GET' && pathname === '/oauth/google/callback') {
    const errorParam = parsedUrl.searchParams.get('error');
    if (errorParam) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!DOCTYPE html>
<html>
<head><title>Gmail OAuth Authorization Declined</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#c9d1d9;text-align:center;}h1{color:#f85149;}</style></head>
<body>
  <h1>Google OAuth Authorization Declined</h1>
  <p>Google returned: <strong>${escapeHtml(errorParam)}</strong></p>
  <p>You can close this tab and retry authorization when ready.</p>
</body>
</html>`);
    }

    const state = parsedUrl.searchParams.get('state');
    const stateValidation = validateAndConsumeOAuthState(state);
    if (!stateValidation.valid) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      const errorMsg = stateValidation.error === 'EXPIRED_STATE'
        ? 'OAuth state token expired. Please restart the authorization flow.'
        : 'Invalid or replayed OAuth state token.';
      return res.end(`<!DOCTYPE html>
<html>
<head><title>OAuth Security Check Failed</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#c9d1d9;text-align:center;}h1{color:#f85149;}</style></head>
<body>
  <h1>OAuth Security Check Failed</h1>
  <p>${escapeHtml(errorMsg)}</p>
  <p><a href="/oauth/google/start" style="color:#58a6ff;">Click here to restart authorization</a></p>
</body>
</html>`);
    }

    const code = parsedUrl.searchParams.get('code');
    if (!code || !code.trim()) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!DOCTYPE html>
<html>
<head><title>Missing Authorization Code</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#c9d1d9;text-align:center;}h1{color:#f85149;}</style></head>
<body>
  <h1>Missing Authorization Code</h1>
  <p>Google did not provide an authorization code in the callback.</p>
</body>
</html>`);
    }

    try {
      const refreshToken = await exchangeCodeForTokens(code);
      saveRefreshToken(refreshToken);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!DOCTYPE html>
<html>
<head><title>Gmail OAuth Connected</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#c9d1d9;text-align:center;}h1{color:#3fb950;}p{font-size:16px;line-height:1.6;}</style></head>
<body>
  <h1>Gmail OAuth connected successfully</h1>
  <p>Your Gmail MCP server is now authorized with the Google Gmail API.</p>
  <p>The refresh token has been stored securely on the server.</p>
  <p>You can close this window and return to naiimOS.</p>
</body>
</html>`);
    } catch (err) {
      const displayMsg = err.message || 'Failed to exchange authorization code for tokens.';
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!DOCTYPE html>
<html>
<head><title>OAuth Token Exchange Failed</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#c9d1d9;text-align:center;}h1{color:#f85149;}</style></head>
<body>
  <h1>OAuth Token Exchange Failed</h1>
  <p>${escapeHtml(displayMsg)}</p>
  <p><a href="/oauth/google/start" style="color:#58a6ff;">Click here to retry authorization</a></p>
</body>
</html>`);
    }
  }

  // 6. Authenticated MCP Transport: POST /mcp or POST /
  if (method === 'POST' && (pathname === '/mcp' || pathname === '/')) {
    // Validate server-to-server MCP authentication
    const authResult = validateMcpAuth(req);
    if (!authResult.authenticated) {
      return sendJson(res, authResult.statusCode || 401, {
        error: authResult.error || { code: 'UNAUTHORIZED', message: 'Invalid MCP credentials' },
      });
    }

    // Parse JSON-RPC payload
    let rpcBody;
    try {
      rpcBody = await parseRequestBody(req);
    } catch (err) {
      if (err.isParseError) {
        return sendJson(res, 400, {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error: Invalid JSON was received by the server.' },
        });
      }
      return sendJson(res, 413, {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: err.message || 'Payload error' },
      });
    }

    if (!rpcBody) {
      return sendJson(res, 400, {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid Request: Empty body.' },
      });
    }

    // Process through JSON-RPC handler
    const response = await handleMcpJsonRpc(rpcBody);
    return sendJson(res, response.statusCode, response.body);
  }

  // 7. Fallback: 404 Not Found
  return sendJson(res, 404, {
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${method} ${pathname}. Available endpoints: GET /health, GET /oauth/status, GET /oauth/google/start, GET /oauth/google/callback, POST /mcp.`,
    },
  });
});

// Auto-start server when run directly (not when imported in test suites)
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase()
);

if (isMain && process.env.NODE_ENV !== 'test' && !process.env.NO_AUTO_START) {
  ensureEnvLoaded();
  server.listen(PORT, HOST, () => {
    console.log(`[Gmail MCP Server] Listening on http://${HOST}:${PORT}`);
    console.log(`[Gmail MCP Server] Health endpoint: http://${HOST}:${PORT}/health`);
    console.log(`[Gmail MCP Server] OAuth start: http://${HOST}:${PORT}/oauth/google/start`);
    console.log(`[Gmail MCP Server] OAuth status: http://${HOST}:${PORT}/oauth/status`);
    console.log(`[Gmail MCP Server] MCP endpoint: http://${HOST}:${PORT}/mcp`);
  });
}
