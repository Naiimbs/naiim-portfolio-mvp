# cms-mcp — MCP server for the portfolio CMS

Exposes the blog and resource CMS as MCP tools over Streamable HTTP (JSON-RPC),
so external AI agents (Claude connectors, n8n MCP node, and any MCP-capable
tool) can draft, update and publish content that renders exactly like the
content created in the admin editor.

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

## Resource tools
- `list_resources` {resource_type?, status?, visibility?, featured?, search?, limit?}
- `get_resource` {slug}
- `create_resource` {title, resource_type, slug?, metadata?, assets?, status?, visibility?, featured?, sort_order?, ...resource fields} — DRAFT by default
- `update_resource` {slug, ...optional resource fields} — only provided fields change
- `publish_resource` {slug}
- `unpublish_resource` {slug} — returns the resource to draft/private without deleting its content
- `upload_resource_asset` {resource_slug, image_url | image_base64, filename?, asset_type?, description?, is_cover?, is_previewable?, is_downloadable?} — uploads and attaches an asset to the resource
- `get_resource_download_stats` {slug?, limit?}

Resources use the existing `content_registry` table with `content_type = 'resource'`.
The MCP preserves the admin editor's JSONB metadata and asset structure, including
resource-type-specific fields, translations, downloadable files, and preview assets.
The recommended flow is `create_resource` as draft → review in the admin editor →
`publish_resource` only after approval.

For resource cover cards, use the `hikayati-editorial-poster` visual system when
generating the artwork: create a finished cover image without text by default.
If a text-based design is explicitly requested, do not place the word `حكايتي`
at the top unless the user specifically asks for it.

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

Security: articles and resources are created as DRAFT by default; only the explicit
publish tools make them live.
Keep MCP_CMS_TOKEN secret and rotate it with `supabase secrets set` if leaked.
