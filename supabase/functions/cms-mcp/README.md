# cms-mcp — MCP server for the blog CMS

Exposes the blog CMS as MCP tools over Streamable HTTP (JSON-RPC), so external
AI agents (Claude connectors, n8n MCP node, and any MCP-capable tool) can draft,
image, update and publish articles that render exactly like the ones created in
the admin editor.

## Endpoint
`https://<project-ref>.functions.supabase.co/cms-mcp`

## Auth
Every request must send: `Authorization: Bearer <MCP_CMS_TOKEN>`
Set the secret:
```
supabase secrets set MCP_CMS_TOKEN=<a-long-random-token> --project-ref <ref>
```

## Deploy
```
supabase functions deploy cms-mcp --no-verify-jwt --project-ref <ref>
```
(Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, injected automatically.)

## Tools
- `list_articles` {status?, limit?}
- `get_article` {slug}
- `create_article` {title, body_markdown, slug?, excerpt?, category?, author?, tags?, seo_title?, seo_description?, og_title?, og_description?, featured_image_url?, status?(draft|published), split_by_heading?} — DRAFT by default
- `update_article` {slug, ...optional fields}
- `publish_article` {slug}
- `unpublish_article` {slug}
- `upload_image` {image_url | image_base64, filename?} → {public_url}

Typical agent flow: `upload_image` → use its `public_url` as `featured_image_url`
in `create_article` (draft) → review → `publish_article`.

## Quick test (curl)
```bash
EP="https://<ref>.functions.supabase.co/cms-mcp"
TOK="<MCP_CMS_TOKEN>"
H=(-H "Authorization: Bearer $TOK" -H "Content-Type: application/json")

# initialize
curl -s "${H[@]}" "$EP" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26"}}'
# list tools
curl -s "${H[@]}" "$EP" -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
# list articles
curl -s "${H[@]}" "$EP" -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_articles","arguments":{"limit":5}}}'
```

## Connect a client
- **Claude (custom connector / claude.ai)**: add a remote MCP server with the
  endpoint URL and the Bearer token.
- **n8n**: MCP Client node → HTTP/Streamable transport → endpoint + Bearer header.
- Other tools: point them at the endpoint with the Authorization header.

Security: articles are created as DRAFT; only `publish_article` makes them live.
Keep MCP_CMS_TOKEN secret and rotate it with `supabase secrets set` if leaked.
