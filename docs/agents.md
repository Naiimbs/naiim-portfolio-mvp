# AI Agents & MCP Gateway Architecture

## 1. Overview
The Naïm Bsili portfolio provides a dedicated showcase for autonomous AI Agents, n8n orchestration pipelines, and personal AI systems. 

Phase 14.1 introduces the **Server-Side MCP Gateway**, allowing visitors to interact with live agent workflows without exposing any API keys, webhook URLs, or MCP access tokens to the browser.

```text
Visitor (Browser)
      │
      ▼
React Agent Demo (/agents/:slug/demo)
      │
      ▼
POST /api/agents/:slug/run
      │
      ▼
MCP Gateway (Server-Side Middleware / Node Service)
      ├── Rate Limiting (IP windowing)
      ├── Input Validation & Max Payload Size
      ├── Tool Allowlist Enforcement
      └── Timeout Protection (30s)
      │
      ▼
n8n MCP HTTP Server (JSON-RPC 2.0 with Bearer Auth)
      │
      ▼
n8n Agent Workflow / Gemini Reasoning / PostgreSQL Memory
      │
      ▼
Structured Response Normalization
      │
      ▼
Browser (Clean Result / Duration / Structured Text)
```

---

## 2. Security Model & Secrets Handling

### The Zero-Trust Browser Principle
1. **Never Expose Tokens to Client**: `N8N_MCP_ACCESS_TOKEN` and `N8N_MCP_SERVER_URL` exist **strictly** inside server-side environment variables (`process.env`). They are never prefixed with `VITE_`.
2. **No Arbitrary Proxying**: The browser cannot choose arbitrary tool names, endpoints, or JSON-RPC methods. The server enforces a strict per-agent tool allowlist.
3. **No Direct n8n Calls**: Client applications never call n8n endpoints directly.

---

## 3. Server-Side Agent Registry (`server/agentRegistry.js`)

Each agent supported by the MCP gateway is declared with an authorized tool allowlist and execution bounds:

```javascript
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
  },
  'career-os': {
    slug: 'career-os',
    name: 'Career OS · Job Search Agent',
    enabled: false, // Scheduled background pipeline
    ...
  },
};
```

---

## 4. API Contract

### Request: `POST /api/agents/:slug/run`
```json
{
  "input": "What projects has Naïm built using n8n and AI?"
}
```

### Response Success (200 OK):
```json
{
  "success": true,
  "status": 200,
  "data": {
    "agent": "naim-copilot",
    "tool": "ask_copilot_assistant",
    "answer": "Naïm has built several AI and automation systems...",
    "durationMs": 450,
    "timestamp": "2026-09-29T00:15:00.000Z"
  }
}
```

### Response Error (Controlled Codes):
```json
{
  "success": false,
  "status": 503,
  "error": {
    "code": "DEMO_UNAVAILABLE",
    "message": "The demo gateway is temporarily unable to connect to the agent backend."
  }
}
```

---

## 5. Rate Limiting & Input Protections
- **Rate Limiter**: Sliding window allowing up to 20 requests per minute per IP. Returns `429 RATE_LIMITED` when exceeded.
- **Payload Constraint**: Maximum input length enforced per agent (default 1,000 characters); maximum HTTP body size of 50KB.
- **Timeout Safeguard**: 30-second hard execution abort prevents hung sockets.

---

## 6. Local Development & Deployment

### Development Mode
In local development, the MCP Gateway runs seamlessly inside the Vite dev server via the custom `api-gateway-middleware` plugin in `vite.config.js`.

```bash
npm run dev
# Starts frontend and API gateway on http://localhost:5173
```

### Standalone Server Mode
For production or serverless container deployments, the standalone Node server can be executed:

```bash
npm run api
# Starts dedicated API listener on http://localhost:3001
```

---

## 7. How to Add a New Agent Demo
1. **CMS Record**: Create the agent in `/admin/agents/new` and set `demo_type` to `internal` with route `/agents/:slug/demo`.
2. **Server Registry**: Add the agent entry in `server/agentRegistry.js` with its allowed MCP tools and environment mapping.
3. **Workflow Integration**: Configure the corresponding tools in n8n HTTP MCP Server.
4. **Publish**: Set status to `published` in the Admin CMS.
