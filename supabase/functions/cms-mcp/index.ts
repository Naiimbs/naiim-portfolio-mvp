// Edge function: cms-mcp
// MCP server (Streamable HTTP / JSON-RPC) exposing the blog CMS as tools, with
// BOTH a static bearer token (for curl / n8n) AND a minimal OAuth 2.1 + PKCE
// flow (for MCP clients like Manus / Claude that require OAuth).
//
// OAuth endpoints are served under the function path (issuer = .../cms-mcp):
//   GET  /cms-mcp/.well-known/oauth-protected-resource
//   GET  /cms-mcp/.well-known/oauth-authorization-server
//   POST /cms-mcp/register        (dynamic client registration)
//   GET  /cms-mcp/authorize        (owner enters the admin token to approve)
//   POST /cms-mcp/authorize
//   POST /cms-mcp/token            (authorization_code + PKCE -> access_token)
//
// Deploy:  supabase functions deploy cms-mcp --no-verify-jwt --project-ref <ref>
// Secret:  MCP_CMS_TOKEN = <long random token> (admin token; also HMAC key)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MCP_TOKEN = Deno.env.get("MCP_CMS_TOKEN") ?? "";
const SITE_ORIGIN = "https://naiimbsili.com";
const ISSUER = "https://btrrvoalqzapnmvqygnp.functions.supabase.co/cms-mcp";
const BUCKET = "portfolio-media";

const SRV_HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const JSON_HEADERS = { ...SRV_HEADERS, "Content-Type": "application/json" };
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-session-id, mcp-protocol-version, x-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const enc = new TextEncoder();

// ---------- crypto (stateless HMAC tokens) ----------
function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(str: string): Uint8Array {
  const s = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(MCP_TOKEN), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}
async function signToken(payload: Record<string, unknown>): Promise<string> {
  const p = b64url(enc.encode(JSON.stringify(payload)));
  return `${p}.${await hmac(p)}`;
}
async function verifyToken(token: string): Promise<any | null> {
  const [p, s] = (token || "").split(".");
  if (!p || !s) return null;
  if (s !== (await hmac(p))) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch { return null; }
}
async function sha256b64url(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return b64url(new Uint8Array(d));
}

// ---------- helpers ----------
function slugify(s: string): string {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}
function stripLeadingH1(body: string): string { return String(body || "").replace(/^\s*#\s+.*\r?\n+/, "").trimStart(); }
function splitSections(body: string): Array<{ title: string; body: string }> {
  const lines = String(body || "").split(/\r?\n/);
  const out: Array<{ title: string; body: string }> = [];
  let cur = { title: "", lines: [] as string[] };
  const flush = () => { if (cur.title || cur.lines.join("").trim()) out.push({ title: cur.title, body: cur.lines.join("\n").trim() }); };
  for (const line of lines) { const h2 = line.match(/^##\s+(.*)$/); if (h2) { flush(); cur = { title: h2[1].trim(), lines: [] }; } else cur.lines.push(line); }
  flush();
  return out;
}
function buildSections(body: string, split: boolean) {
  const base = Date.now();
  const clean = stripLeadingH1(body);
  if (!split) return [{ id: `sec-mcp-${base}`, section_type: "rich_text", label: "Article Body", sort_order: 10, is_visible: true, config: { eyebrow: "", title: "", body: clean, alignment: "left" } }];
  return splitSections(clean).map((p, i) => ({ id: `sec-mcp-${base}-${i}`, section_type: "rich_text", label: (p.title ? `Body · ${p.title}` : "Intro").slice(0, 60), sort_order: (i + 1) * 10, is_visible: true, config: { eyebrow: "", title: p.title || "", body: p.body, alignment: "left" } }));
}
function stats(text: string) { const words = String(text || "").trim().split(/\s+/).filter(Boolean).length; return { wordCount: words, readingTime: `${Math.max(1, Math.round(words / 200))} min read` }; }
async function sbSelect(path: string): Promise<any[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SRV_HEADERS });
  if (!r.ok) throw new Error(`select failed: ${r.status} ${await r.text()}`);
  return await r.json();
}

// ---------- tools ----------
const TOOLS = [
  { name: "list_articles", description: "List blog articles with their status.", inputSchema: { type: "object", properties: { status: { type: "string", enum: ["draft", "in_review", "ready", "published", "archived"] }, limit: { type: "number" } } } },
  { name: "get_article", description: "Get a blog article by slug (full content).", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "create_article", description: "Create a new blog article (DRAFT by default). Body is markdown; headings can be split into sections.", inputSchema: { type: "object", properties: { title: { type: "string" }, slug: { type: "string" }, excerpt: { type: "string" }, category: { type: "string" }, author: { type: "string" }, tags: { type: "array", items: { type: "string" } }, body_markdown: { type: "string" }, seo_title: { type: "string" }, seo_description: { type: "string" }, og_title: { type: "string" }, og_description: { type: "string" }, featured_image_url: { type: "string" }, status: { type: "string", enum: ["draft", "published"] }, split_by_heading: { type: "boolean" } }, required: ["title", "body_markdown"] } },
  { name: "update_article", description: "Update fields of an existing article by slug (only provided fields change).", inputSchema: { type: "object", properties: { slug: { type: "string" }, title: { type: "string" }, excerpt: { type: "string" }, category: { type: "string" }, tags: { type: "array", items: { type: "string" } }, body_markdown: { type: "string" }, seo_title: { type: "string" }, seo_description: { type: "string" }, og_title: { type: "string" }, og_description: { type: "string" }, featured_image_url: { type: "string" }, split_by_heading: { type: "boolean" } }, required: ["slug"] } },
  { name: "publish_article", description: "Publish an article (status=published, public).", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "unpublish_article", description: "Revert an article to draft.", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "upload_image", description: "Upload an image (from a URL or base64) and return its public URL. Use for featured_image_url.", inputSchema: { type: "object", properties: { image_url: { type: "string" }, image_base64: { type: "string" }, filename: { type: "string" } } } },
];

async function callTool(name: string, args: any): Promise<any> {
  args = args || {};
  if (name === "list_articles") {
    const status = args.status ? `&status=eq.${encodeURIComponent(args.status)}` : "";
    const limit = Number(args.limit) || 50;
    const rows = await sbSelect(`content_registry?content_type=eq.blog${status}&select=slug,title,status,visibility,updated_at,metadata&order=updated_at.desc&limit=${limit}`);
    return rows.map((r) => ({ slug: r.slug, title: r.title, status: r.status, category: r.metadata?.category || "", updated_at: r.updated_at, url: `${SITE_ORIGIN}/blog/${r.slug}` }));
  }
  if (name === "get_article") {
    const rows = await sbSelect(`content_registry?slug=eq.${encodeURIComponent(args.slug)}&content_type=eq.blog&select=*&limit=1`);
    if (!rows[0]) throw new Error(`Article not found: ${args.slug}`);
    return rows[0];
  }
  if (name === "create_article") {
    const title = String(args.title || "").trim();
    if (!title) throw new Error("title is required");
    if (!args.body_markdown) throw new Error("body_markdown is required");
    const slug = slugify(args.slug || title);
    if ((await sbSelect(`content_registry?slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`))[0]) throw new Error(`Slug already in use: ${slug}`);
    const split = args.split_by_heading !== false;
    const sections = buildSections(args.body_markdown, split);
    const { wordCount, readingTime } = stats([args.excerpt || "", ...sections.map((s: any) => s.config.body)].join(" "));
    const status = args.status === "published" ? "published" : "draft";
    const metadata = { excerpt: args.excerpt || "", author: args.author || "Naïm Bsili", category: args.category || "AI & Automation", tags: Array.isArray(args.tags) ? args.tags : [], featuredImage: args.featured_image_url || "", sections, readingTime, wordCount, publishedAt: status === "published" ? new Date().toISOString() : undefined, seo: { title: args.seo_title || "", description: args.seo_description || "", canonical: "" }, social: { ogTitle: args.og_title || "", ogDescription: args.og_description || "", ogImage: args.featured_image_url || "" }, relationships: [] };
    const row = { title, slug, content_type: "blog", status, visibility: "public", featured: false, sort_order: 0, public_route: `/blog/${slug}`, metadata };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/content_registry`, { method: "POST", headers: { ...JSON_HEADERS, Prefer: "return=representation" }, body: JSON.stringify(row) });
    if (!r.ok) throw new Error(`create failed: ${r.status} ${await r.text()}`);
    const created = (await r.json())[0];
    return { id: created.id, slug, status, sections: sections.length, url: `${SITE_ORIGIN}/blog/${slug}`, admin_url: `${SITE_ORIGIN}/admin/content/blog/${created.id}` };
  }
  if (name === "update_article") {
    const cur = (await sbSelect(`content_registry?slug=eq.${encodeURIComponent(args.slug)}&content_type=eq.blog&select=*&limit=1`))[0];
    if (!cur) throw new Error(`Article not found: ${args.slug}`);
    const meta = { ...(cur.metadata || {}) };
    if (args.excerpt !== undefined) meta.excerpt = args.excerpt;
    if (args.category !== undefined) meta.category = args.category;
    if (Array.isArray(args.tags)) meta.tags = args.tags;
    if (args.featured_image_url !== undefined) { meta.featuredImage = args.featured_image_url; meta.social = { ...(meta.social || {}), ogImage: args.featured_image_url }; }
    if (args.seo_title !== undefined || args.seo_description !== undefined) meta.seo = { ...(meta.seo || {}), title: args.seo_title ?? meta.seo?.title ?? "", description: args.seo_description ?? meta.seo?.description ?? "" };
    if (args.og_title !== undefined || args.og_description !== undefined) meta.social = { ...(meta.social || {}), ogTitle: args.og_title ?? meta.social?.ogTitle ?? "", ogDescription: args.og_description ?? meta.social?.ogDescription ?? "" };
    if (args.body_markdown !== undefined) { meta.sections = buildSections(args.body_markdown, args.split_by_heading !== false); const s = stats([meta.excerpt || "", ...meta.sections.map((x: any) => x.config.body)].join(" ")); meta.wordCount = s.wordCount; meta.readingTime = s.readingTime; }
    const patch: any = { metadata: meta };
    if (args.title) patch.title = String(args.title).trim();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/content_registry?slug=eq.${encodeURIComponent(args.slug)}`, { method: "PATCH", headers: { ...JSON_HEADERS, Prefer: "return=representation" }, body: JSON.stringify(patch) });
    if (!r.ok) throw new Error(`update failed: ${r.status} ${await r.text()}`);
    return { slug: args.slug, updated: true, url: `${SITE_ORIGIN}/blog/${args.slug}` };
  }
  if (name === "publish_article" || name === "unpublish_article") {
    const publish = name === "publish_article";
    const cur = (await sbSelect(`content_registry?slug=eq.${encodeURIComponent(args.slug)}&content_type=eq.blog&select=metadata&limit=1`))[0];
    if (!cur) throw new Error(`Article not found: ${args.slug}`);
    const meta = { ...(cur.metadata || {}) };
    if (publish && !meta.publishedAt) meta.publishedAt = new Date().toISOString();
    const patch = { status: publish ? "published" : "draft", visibility: "public", metadata: meta };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/content_registry?slug=eq.${encodeURIComponent(args.slug)}`, { method: "PATCH", headers: { ...JSON_HEADERS, Prefer: "return=representation" }, body: JSON.stringify(patch) });
    if (!r.ok) throw new Error(`${name} failed: ${r.status} ${await r.text()}`);
    return { slug: args.slug, status: patch.status, url: `${SITE_ORIGIN}/blog/${args.slug}` };
  }
  if (name === "upload_image") {
    let bytes: Uint8Array; let contentType = "image/png"; let srcName = args.filename || "image.png";
    if (args.image_url) {
      const ir = await fetch(args.image_url);
      if (!ir.ok) throw new Error(`fetch image failed: ${ir.status}`);
      contentType = ir.headers.get("content-type") || contentType;
      bytes = new Uint8Array(await ir.arrayBuffer());
      try { srcName = args.filename || new URL(args.image_url).pathname.split("/").pop() || srcName; } catch { /* keep */ }
    } else if (args.image_base64) {
      bytes = b64urlToBytes(String(args.image_base64).replace(/^data:[^;]+;base64,/, "").replace(/\+/g, "-").replace(/\//g, "_"));
    } else throw new Error("Provide image_url or image_base64");
    const path = `blog/${Date.now()}_${String(srcName).replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { ...SRV_HEADERS, "Content-Type": contentType, "x-upsert": "true" }, body: bytes });
    if (!up.ok) throw new Error(`upload failed: ${up.status} ${await up.text()}`);
    return { public_url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`, bytes: bytes.length, content_type: contentType };
  }
  throw new Error(`Unknown tool: ${name}`);
}

// ---------- JSON-RPC ----------
const jhead = { ...CORS, "Content-Type": "application/json" };
function rpcResult(id: any, result: any) { return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { headers: jhead }); }
function rpcError(id: any, code: number, message: string) { return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), { headers: jhead }); }

async function isAuthorized(req: Request, url: URL): Promise<boolean> {
  if (!MCP_TOKEN) return false;
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const apikey = (req.headers.get("x-api-key") || "").trim();
  const qtok = (url.searchParams.get("token") || url.searchParams.get("apikey") || "").trim();
  if (bearer === MCP_TOKEN || apikey === MCP_TOKEN || qtok === MCP_TOKEN) return true;
  if (bearer) { const p = await verifyToken(bearer); if (p && p.typ === "access") return true; }
  return false;
}

function authorizeForm(params: Record<string, string>, error = ""): Response {
  const hidden = Object.entries(params).map(([k, v]) => `<input type="hidden" name="${k}" value="${(v || "").replace(/"/g, "&quot;")}">`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authorize NaiimB CMS</title>
<style>body{font-family:system-ui,sans-serif;max-width:420px;margin:12vh auto;padding:0 20px}h1{font-size:1.2rem}input[type=password]{width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;margin:8px 0}button{width:100%;padding:10px;border:0;border-radius:8px;background:#087f66;color:#fff;font-weight:600;cursor:pointer}.e{color:#c0392b;font-size:.9rem}</style></head>
<body><h1>Authorize access to NaiimB CMS</h1><p>Enter your CMS admin token to let this client manage your blog.</p>
${error ? `<p class="e">${error}</p>` : ""}
<form method="POST"><input type="password" name="admin_token" placeholder="Admin token" autofocus required>${hidden}<button type="submit">Authorize</button></form></body></html>`;
  return new Response(html, { headers: { ...CORS, "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const idx = url.pathname.indexOf("/cms-mcp");
  let sub = (idx >= 0 ? url.pathname.slice(idx + "/cms-mcp".length) : "").replace(/\/+$/, "");

  // ---- OAuth discovery metadata (public) ----
  if (sub === "/.well-known/oauth-protected-resource") {
    return new Response(JSON.stringify({ resource: ISSUER, authorization_servers: [ISSUER] }), { headers: jhead });
  }
  if (sub === "/.well-known/oauth-authorization-server" || sub === "/.well-known/openid-configuration") {
    return new Response(JSON.stringify({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      registration_endpoint: `${ISSUER}/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    }), { headers: jhead });
  }

  // ---- Dynamic client registration (public) ----
  if (sub === "/register" && req.method === "POST") {
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    return new Response(JSON.stringify({
      client_id: `cms-mcp-${b64url(crypto.getRandomValues(new Uint8Array(8)))}`,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: body.redirect_uris || [],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }), { status: 201, headers: jhead });
  }

  // ---- Authorization endpoint ----
  if (sub === "/authorize") {
    const p = (k: string) => url.searchParams.get(k) || "";
    if (req.method === "GET") {
      return authorizeForm({ client_id: p("client_id"), redirect_uri: p("redirect_uri"), code_challenge: p("code_challenge"), code_challenge_method: p("code_challenge_method"), state: p("state"), scope: p("scope"), resource: p("resource") });
    }
    if (req.method === "POST") {
      const form = await req.formData();
      const g = (k: string) => String(form.get(k) || "");
      const redirect_uri = g("redirect_uri");
      if (g("admin_token") !== MCP_TOKEN) {
        return authorizeForm({ client_id: g("client_id"), redirect_uri, code_challenge: g("code_challenge"), code_challenge_method: g("code_challenge_method"), state: g("state"), scope: g("scope"), resource: g("resource") }, "Invalid admin token.");
      }
      const code = await signToken({ typ: "code", cc: g("code_challenge"), ru: redirect_uri, exp: Math.floor(Date.now() / 1000) + 300 });
      const sep = redirect_uri.includes("?") ? "&" : "?";
      const loc = `${redirect_uri}${sep}code=${encodeURIComponent(code)}${g("state") ? `&state=${encodeURIComponent(g("state"))}` : ""}`;
      return new Response(null, { status: 302, headers: { ...CORS, Location: loc } });
    }
  }

  // ---- Token endpoint ----
  if (sub === "/token" && req.method === "POST") {
    let params: Record<string, string> = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) { try { params = await req.json(); } catch { /* */ } }
    else { const f = await req.formData(); for (const [k, v] of f.entries()) params[k] = String(v); }
    if (params.grant_type !== "authorization_code") return new Response(JSON.stringify({ error: "unsupported_grant_type" }), { status: 400, headers: jhead });
    const codePayload = await verifyToken(params.code || "");
    if (!codePayload || codePayload.typ !== "code") return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400, headers: jhead });
    if (codePayload.ru && params.redirect_uri && codePayload.ru !== params.redirect_uri) return new Response(JSON.stringify({ error: "invalid_grant", error_description: "redirect_uri mismatch" }), { status: 400, headers: jhead });
    if (codePayload.cc) {
      const challenge = await sha256b64url(params.code_verifier || "");
      if (challenge !== codePayload.cc) return new Response(JSON.stringify({ error: "invalid_grant", error_description: "PKCE failed" }), { status: 400, headers: jhead });
    }
    const access = await signToken({ typ: "access", exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90 });
    return new Response(JSON.stringify({ access_token: access, token_type: "Bearer", expires_in: 60 * 60 * 24 * 90 }), { headers: jhead });
  }

  // ---- MCP JSON-RPC endpoint (requires auth) ----
  if (!(await isAuthorized(req, url))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...jhead, "WWW-Authenticate": `Bearer resource_metadata="${ISSUER}/.well-known/oauth-protected-resource"` },
    });
  }
  if (req.method === "GET") return new Response("Method Not Allowed", { status: 405, headers: CORS });

  let msg: any;
  try { msg = await req.json(); } catch { return rpcError(null, -32700, "Parse error"); }
  const { id, method, params } = msg || {};

  if (method && method.startsWith("notifications/")) return new Response(null, { status: 202, headers: CORS });
  if (method === "initialize") {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, result: { protocolVersion: params?.protocolVersion || "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "naiimbsili-cms", version: "1.1.0" } } }), { headers: { ...jhead, "Mcp-Session-Id": crypto.randomUUID() } });
  }
  if (method === "ping") return rpcResult(id, {});
  if (method === "tools/list") return rpcResult(id, { tools: TOOLS });
  if (method === "tools/call") {
    try {
      const out = await callTool(params?.name, params?.arguments);
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
    } catch (err) {
      return rpcResult(id, { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true });
    }
  }
  return rpcError(id ?? null, -32601, `Method not found: ${method}`);
});
