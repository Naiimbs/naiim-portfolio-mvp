# AI Agents & MCP Gateway Architecture

## 1. Overview
The Naïm Bsili portfolio provides a dedicated showcase for autonomous AI Agents, n8n orchestration pipelines, and personal AI systems.

Phase 14.2 implements **Real MCP Connection & Live Agent Demo Protocol**, connecting the React UI to live n8n workflows over JSON-RPC 2.0 without exposing API credentials or server endpoints to the client.

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
      ├── Rate Limiting (IP sliding window: 20 req/min)
      ├── Input Validation & Max Payload Size
      ├── Tool Allowlist & Schema Resolution
      └── Timeout Protection (30s)
      │
      ▼
Real n8n MCP HTTP Endpoint
      ├── 1. initialize (Protocol handshake)
      ├── 2. notifications/initialized
      ├── 3. tools/list (cached with 5min TTL)
      └── 4. tools/call (real arguments & execution)
      │
      ▼
Real n8n Agent Workflow (Gemini reasoning / PostgreSQL vector memory / APIs)
      │
      ▼
Structured Response Normalization
      │
      ▼
Browser (Real Answer / Duration / Verified Tool Metadata)
```

---

## 2. Zero-Trust Security Model & Secrets Handling

1. **Server-Side Only**: `N8N_MCP_ACCESS_TOKEN` and `N8N_MCP_SERVER_URL` exist **strictly** inside server-side environment variables (`process.env`). They are never prefixed with `VITE_`.
2. **Never Bundled or Exposed**: Secrets never touch React components, HTML, Vite client builds, browser storage (`localStorage`/`sessionStorage`), network responses, or client console logs.
3. **No Arbitrary Tool Execution**: The browser cannot specify custom endpoints, tool names, or raw JSON-RPC methods. The server enforces a strict per-agent tool allowlist defined in `server/agentRegistry.js`.
4. **Credential Rotation**: Any MCP token previously exposed or pasted in public channels must be revoked and replaced with a newly generated credential in `.env`.

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
    enabled: false, // Scheduled background pipeline (interactive demo disabled)
    mcpServerEnv: 'N8N_MCP_SERVER_URL',
    mcpTokenEnv: 'N8N_MCP_ACCESS_TOKEN',
    allowedTools: ['fetch_job_digest', 'score_job_fit'],
    defaultTool: 'fetch_job_digest',
    timeoutMs: 30000,
    maxInputLength: 500,
  },
};
```

---

## 4. MCP Diagnostic CLI (`npm run mcp:check`)

A server-side diagnostic command is included to verify endpoint health, authentication, handshake, and tool discovery before testing the frontend:

```bash
npm run mcp:check
```

### Example Diagnostic Output (When Configured):
```text
====================================================
  MCP DIAGNOSTIC CHECK (Phase 14.2)
====================================================

MCP server: CONFIGURED
Endpoint host: n8n.example.com
Endpoint path: /mcp-server/http
Token provided: YES (masked)

Step 1: Testing MCP initialization (`initialize`)...
HTTP Status: 200 OK
MCP initialization: SUCCESS
Server Info: n8n-mcp-server (1.0.0)
Protocol version: 2024-11-05

Step 2: Discovering tools (`tools/list`)...
Tools discovered: 4

Available tools:
- ask_copilot_assistant: Answers user queries about Naïm's portfolio and skills
    Parameters: prompt, query
- search_projects: Semantic search across portfolio case studies
    Parameters: query
- query_knowledge_base: Fetches deep background information
    Parameters: topic
- get_copilot_summary: Generates an executive bio summary
    Parameters: focus
```

---

## 5. API Contracts

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
    "answer": "Naïm has designed and engineered several autonomous AI and automation systems...",
    "durationMs": 1420,
    "timestamp": "2026-09-29T00:30:00.000Z"
  }
}
```

### Response Error (Normalized & Safe):
```json
{
  "success": false,
  "status": 503,
  "error": {
    "code": "DEMO_UNAVAILABLE",
    "message": "Copilot is temporarily unavailable. Please try again later."
  }
}
```

---

## 6. Production Deployment Requirements

The MCP Gateway requires a server runtime (Node.js, Express, or Serverless API function) capable of reading private environment variables:

```text
Frontend (Vite React Build / Static CDN)
      │
      ▼
Server / API Function (e.g. Node.js on VPS / Docker / Vercel API / Cloud Functions)
      │  (Holds N8N_MCP_SERVER_URL and N8N_MCP_ACCESS_TOKEN in private environment)
      ▼
n8n MCP HTTP Endpoint
```

*In local development, the gateway runs within Vite's development server (`vite.config.js`). In standalone production, run `npm run api` or mount `handleApiRequest` inside an Express/Fastify/Next.js/Cloud Function backend.*
