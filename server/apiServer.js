import http from 'node:http';
import { runAgentDemo } from './mcpGateway.js';
import { getAgentServerConfig } from './agentRegistry.js';

const PORT = process.env.PORT || process.env.API_PORT || 3001;

// Simple In-Memory Rate Limiter (Sliding Window per IP)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests/min
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

export function handleApiRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // 1. Health check
  if (method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
  }

  // 2. Agent Metadata query: GET /api/agents/:slug/info
  const infoMatch = pathname.match(/^\/api\/agents\/([a-zA-Z0-9_-]+)\/info$/);
  if (method === 'GET' && infoMatch) {
    const slug = infoMatch[1];
    const info = getAgentServerConfig(slug);
    if (!info) {
      return sendJson(res, 404, {
        success: false,
        error: { code: 'NOT_FOUND', message: `Agent "${slug}" not found.` },
      });
    }
    return sendJson(res, 200, { success: true, data: info });
  }

  // 3. Agent Execution: POST /api/agents/:slug/run
  const runMatch = pathname.match(/^\/api\/agents\/([a-zA-Z0-9_-]+)\/run$/);
  if (method === 'POST' && runMatch) {
    const slug = runMatch[1];
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Apply Rate Limiting
    if (isRateLimited(clientIp)) {
      return sendJson(res, 429, {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a minute before running the agent again.',
        },
      });
    }

    let bodyRaw = '';
    const MAX_PAYLOAD_BYTES = 50 * 1024; // 50KB

    req.on('data', (chunk) => {
      bodyRaw += chunk;
      if (bodyRaw.length > MAX_PAYLOAD_BYTES) {
        req.destroy();
        sendJson(res, 413, {
          success: false,
          error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload size limit exceeded.' },
        });
      }
    });

    req.on('end', async () => {
      try {
        const body = bodyRaw ? JSON.parse(bodyRaw) : {};
        const input = body.input || body.prompt || body.message;
        const toolName = body.tool || body.toolName;
        const context = body.context || {};

        const result = await runAgentDemo({
          slug,
          input,
          toolName,
          context,
        });

        sendJson(res, result.status || (result.success ? 200 : 500), result);
      } catch (parseErr) {
        sendJson(res, 400, {
          success: false,
          error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' },
        });
      }
    });

    return;
  }

  // Default 404 for unhandled /api/ routes
  if (pathname.startsWith('/api/')) {
    return sendJson(res, 404, {
      success: false,
      error: { code: 'ROUTE_NOT_FOUND', message: 'API route not found.' },
    });
  }

  return false;
}

// Standalone Server runner (if executed via `node server/apiServer.js`)
if (process.argv[1] && process.argv[1].endsWith('apiServer.js')) {
  const server = http.createServer((req, res) => {
    const handled = handleApiRequest(req, res);
    if (!handled) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`[MCP Demo API Server] Running on http://localhost:${PORT}`);
  });
}
