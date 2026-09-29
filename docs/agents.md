# AI Agents & MCP Gateway Architecture

## 1. Overview
The Naïm Bsili portfolio provides a dedicated showcase for autonomous AI Agents, n8n orchestration pipelines, and personal AI systems.

Phase 14.3.1 elevates the Admin CMS into a true **AI Agent Control Center** by introducing:
1. **Visual 3-Step Agent Runtime Builder** in the Agent Editor (`/admin/agents/:id`).
2. **Interactive Runtime Console CLI** (`/admin/runtime-console`) backed by secure server APIs.
3. **Multi-Agent Decoupled Architecture**: One server-side MCP connection powers multiple independent CMS agents.

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
      ├── Rate Limiting (IP sliding window: 30 req/min)
      ├── Input Validation & Max Payload Size
      ├── Admin Console Command Dispatcher (POST /api/admin/runtime-console)
      │
      ▼
Supabase CMS Runtime Resolver
      ├── public.agents (metadata & status)
      ├── public.agent_runtime_configs (runtime_type, allowed_tools, timeout_ms, default_tool)
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
3. **No Shell Execution**: The Runtime Console does **not** execute OS terminal commands (no `child_process.exec` or arbitrary bash). It dispatches strictly whitelisted JSON diagnostic commands to the existing server MCP gateway.
4. **Role-Based Protection**: Admin console execution requires Admin/Editor privileges. Viewers receive `403 Forbidden`.

---

## 3. Visual 3-Step Agent Runtime Builder

Located in `/admin/agents/:id`:

### **Step 01 — Runtime Engine**
- Toggle between `None (Static / Background)` and `Model Context Protocol (MCP)`.

### **Step 02 — MCP Connection**
- Select registered connection (e.g. `n8n-main`).
- Real-time connection status pill (`🟢 Connected`, `🟡 Not Tested`, `⚪ Not Configured`, `🔴 Unavailable`).
- `Test Connection` trigger executes server-side handshake.

### **Step 03 — Tool Allowlist & Default Tool**
- Checkbox list of discovered/verified tools (`ask_copilot_assistant`, `search_projects`, `query_knowledge_base`, `get_copilot_summary`).
- Default tool selector with validation (default tool must be in the allowed tools list).
- Execution settings: Timeout (5–60s) and Max input (100–5000 chars).
- `Test Agent` trigger queries the live agent with a safe test prompt and returns the parsed output and execution latency.

---

## 4. Admin Runtime Console CLI

Located in `/admin/runtime-console`:

### Supported Whitelisted Commands:
| Command | Description |
| :--- | :--- |
| `help` | Lists all available console commands |
| `status` | Reports Node gateway status, MCP key, and server secret configuration state |
| `mcp status` | Inspects connection parameters and host of active connection |
| `mcp tools` | Queries and prints live tools from active MCP server |
| `mcp test` | Executes handshake (`initialize`) and reports health |
| `agent list` | Lists all registered agents and their runtime / demo states |
| `agent inspect <slug>` | Returns safe runtime metadata for a specific agent |
| `agent tools <slug>` | Lists allowed tools and the designated default tool for an agent |
| `agent test <slug>` | Executes live end-to-end diagnostic test query on the specified agent |
| `clear` | Clears terminal output (also supported via `Ctrl + K`) |

---

## 5. Difference: `Test Connection` vs `Test Agent`

- **`Test Connection`**: Performs lightweight protocol verification (`initialize` and `tools/list`) to ensure the n8n HTTP server is reachable and credentials are valid.
- **`Test Agent`**: Executes a real `tools/call` query using the agent's specific CMS configuration (default tool, timeout, input formatting) to verify end-to-end LLM/workflow reasoning.

---

## 6. MCP Diagnostic CLI (`npm run mcp:check`)

Run from your server or local terminal:

```bash
# Default check (resolves connection key "n8n-main")
npm run mcp:check

# Custom connection key check
npm run mcp:check -- n8n-main
```
