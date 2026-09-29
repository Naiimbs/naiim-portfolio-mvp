# AI Agents & MCP Gateway Architecture

## 1. Overview
The Naïm Bsili portfolio provides a dedicated showcase for autonomous AI Agents, n8n orchestration pipelines, and personal AI systems.

Phase 14.3 establishes the **CMS-Driven Agent Runtime & MCP Connections Architecture**, decoupling Agent definition and tool configuration into Supabase CMS while keeping all connection secrets (tokens, endpoints) strictly inside server-side environment variables / secret manager.

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
Demo API Server (Node / Vite Gateway Middleware)
      ├── Rate Limiting (IP sliding window: 20 req/min)
      ├── Input Validation & Max Payload Size
      │
      ▼
Supabase CMS Runtime Resolver
      ├── public.agents (metadata & status)
      ├── public.agent_runtime_configs (runtime_type, allowed_tools, timeout_ms)
      └── public.mcp_connections (connection_key, provider, status)
      │
      ▼
Server Secret Resolver (`server/mcpConnections.js`)
      └── connection_key ("n8n-main") ──► process.env (N8N_MCP_SERVER_URL, N8N_MCP_ACCESS_TOKEN)
      │
      ▼
MCP Gateway (`server/mcpGateway.js`)
      ├── 1. Protocol Handshake (initialize -> notifications/initialized)
      ├── 2. Cached Tool Discovery (tools/list with 5min TTL)
      ├── 3. Tool Allowlist & Parameter Alignment Check
      └── 4. Tool Execution (tools/call with 30s timeout)
      │
      ▼
Real n8n Agent / Workflow (Gemini reasoning / PostgreSQL vector memory / Tools)
      │
      ▼
Structured Response Normalization
      │
      ▼
Browser (Real Answer / Duration / Verified Tool Metadata)
```

---

## 2. Zero-Trust Security Model & Secrets Handling

1. **Strictly Server-Side**: `N8N_MCP_ACCESS_TOKEN` and `N8N_MCP_SERVER_URL` exist **strictly** inside server-side environment variables (`process.env`). They are never prefixed with `VITE_`.
2. **CMS Contains No Secrets**: The Supabase tables (`public.mcp_connections`, `public.agent_runtime_configs`) only store safe non-secret metadata (`connection_key = "n8n-main"`).
3. **No Arbitrary Tool Invocation**: The browser only sends the query prompt. The server verifies the tool allowlist against the CMS configuration before dispatching `tools/call`.
4. **Admin Protection**: Admin connection testing endpoints (`POST /api/admin/mcp-connections/:key/test`) execute live handshakes and return tool metadata without ever echoing the auth bearer tokens.

---

## 3. Database Schema (Migration `004_agent_runtime_mcp.sql`)

### `public.mcp_connections`
```sql
CREATE TABLE public.mcp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL DEFAULT 'n8n', -- 'n8n', 'custom'
    connection_key TEXT UNIQUE NOT NULL,  -- maps to server secret resolver
    server_url_hint TEXT,                 -- non-secret host reference
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `public.agent_runtime_configs`
```sql
CREATE TABLE public.agent_runtime_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID UNIQUE NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    runtime_type TEXT NOT NULL DEFAULT 'none', -- 'none', 'mcp'
    mcp_connection_id UUID REFERENCES public.mcp_connections(id) ON DELETE SET NULL,
    default_tool TEXT,
    allowed_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeout_ms INTEGER NOT NULL DEFAULT 30000,
    max_input_length INTEGER NOT NULL DEFAULT 1000,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. MCP Diagnostic CLI (`npm run mcp:check`)

A server-side diagnostic command is included to verify endpoint health, authentication, handshake, and tool discovery before testing the frontend:

```bash
# Default check (resolves connection key "n8n-main")
npm run mcp:check

# Custom connection key check
npm run mcp:check -- n8n-main
```

### Diagnostic Output Example:
```text
====================================================
  MCP DIAGNOSTIC CHECK (Phase 14.3)
====================================================

Connection Key: n8n-main
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

## 5. Admin CMS Pages

- **`/admin/mcp-connections`**: Directory of registered MCP endpoints, status, active toggles, and live connection test triggers.
- **`/admin/mcp-connections/:id`**: Editor for connection metadata, provider, connection keys, and live handshake diagnostic tool discovery.
- **`/admin/agents/:id`**: Includes the **Runtime & MCP Connection** configuration card allowing admins to bind agents to MCP connections, select default tools, and manage allowed tool allowlists.

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
