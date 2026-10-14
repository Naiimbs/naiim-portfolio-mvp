// Edge function: cms-mcp
// A minimal MCP (Model Context Protocol) server over Streamable HTTP (JSON-RPC)
// that exposes the blog CMS as tools, so external AI agents (Claude connectors,
// n8n, Manus if it supports MCP) can draft, update, image and publish articles.
//
// Auth: every request must send `Authorization: Bearer <MCP_CMS_TOKEN>`.
// Writes use the service-role key (bypasses RLS); articles are created as DRAFT
// by default and only go live via the explicit publish_article tool.
//
// Deploy:  supabase functions deploy cms-mcp --no-verify-jwt --project-ref <ref>
// Secret:  supabase secrets set MCP_CMS_TOKEN=<a-long-random-token>

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MCP_TOKEN = Deno.env.get("MCP_CMS_TOKEN") ?? "";
const SITE_ORIGIN = "https://naiimbsili.com";
const BUCKET = "portfolio-media";

const SRV_HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const JSON_HEADERS = { ...SRV_HEADERS, "Content-Type": "application/json" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ---------- helpers ----------
function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function stripLeadingH1(body: string): string {
  return String(body || "").replace(/^\s*#\s+.*\r?\n+/, "").trimStart();
}

function splitSections(body: string): Array<{ title: string; body: string }> {
  const lines = String(body || "").split(/\r?\n/);
  const out: Array<{ title: string; body: string }> = [];
  let cur = { title: "", lines: [] as string[] };
  const flush = () => {
    if (cur.title || cur.lines.join("").trim()) out.push({ title: cur.title, body: cur.lines.join("\n").trim() });
  };
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) { flush(); cur = { title: h2[1].trim(), lines: [] }; }
    else cur.lines.push(line);
  }
  flush();
  return out;
}

function buildSections(body: string, split: boolean) {
  const base = Date.now();
  const clean = stripLeadingH1(body);
  if (!split) {
    return [{ id: `sec-mcp-${base}`, section_type: "rich_text", label: "Article Body", sort_order: 10, is_visible: true, config: { eyebrow: "", title: "", body: clean, alignment: "left" } }];
  }
  return splitSections(clean).map((p, i) => ({
    id: `sec-mcp-${base}-${i}`,
    section_type: "rich_text",
    label: (p.title ? `Body · ${p.title}` : "Intro").slice(0, 60),
    sort_order: (i + 1) * 10,
    is_visible: true,
    config: { eyebrow: "", title: p.title || "", body: p.body, alignment: "left" },
  }));
}

function stats(text: string) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  return { wordCount: words, readingTime: `${Math.max(1, Math.round(words / 200))} min read` };
}

async function sbSelect(path: string): Promise<any[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SRV_HEADERS });
  if (!r.ok) throw new Error(`select failed: ${r.status} ${await r.text()}`);
  return await r.json();
}

// ---------- tools ----------
const TOOLS = [
  { name: "list_articles", description: "List blog articles with their status.", inputSchema: { type: "object", properties: { status: { type: "string", enum: ["draft", "in_review", "ready", "published", "archived"] }, limit: { type: "number" } } } },
  { name: "get_article", description: "Get a blog article by slug (full content).", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  {
    name: "create_article",
    description: "Create a new blog article (DRAFT by default). Body is markdown; headings can be split into separate sections.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" }, slug: { type: "string" }, excerpt: { type: "string" },
        category: { type: "string" }, author: { type: "string" }, tags: { type: "array", items: { type: "string" } },
        body_markdown: { type: "string" }, seo_title: { type: "string" }, seo_description: { type: "string" },
        og_title: { type: "string" }, og_description: { type: "string" }, featured_image_url: { type: "string" },
        status: { type: "string", enum: ["draft", "published"] }, split_by_heading: { type: "boolean" },
      },
      required: ["title", "body_markdown"],
    },
  },
  {
    name: "update_article",
    description: "Update fields of an existing article by slug (only provided fields change).",
    inputSchema: { type: "object", properties: { slug: { type: "string" }, title: { type: "string" }, excerpt: { type: "string" }, category: { type: "string" }, tags: { type: "array", items: { type: "string" } }, body_markdown: { type: "string" }, seo_title: { type: "string" }, seo_description: { type: "string" }, og_title: { type: "string" }, og_description: { type: "string" }, featured_image_url: { type: "string" }, split_by_heading: { type: "boolean" } }, required: ["slug"] },
  },
  { name: "publish_article", description: "Publish an article (status=published, public).", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "unpublish_article", description: "Revert an article to draft.", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "upload_image", description: "Upload an image (from a URL or base64) to storage and return its public URL. Use it for featured_image_url.", inputSchema: { type: "object", properties: { image_url: { type: "string" }, image_base64: { type: "string" }, filename: { type: "string" } } } },
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
    const existing = await sbSelect(`content_registry?slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`);
    if (existing[0]) throw new Error(`Slug already in use: ${slug}`);

    const split = args.split_by_heading !== false;
    const sections = buildSections(args.body_markdown, split);
    const bodyText = [args.excerpt || "", ...sections.map((s: any) => s.config.body)].join(" ");
    const { wordCount, readingTime } = stats(bodyText);
    const status = args.status === "published" ? "published" : "draft";

    const metadata = {
      excerpt: args.excerpt || "",
      author: args.author || "Naïm Bsili",
      category: args.category || "AI & Automation",
      tags: Array.isArray(args.tags) ? args.tags : [],
      featuredImage: args.featured_image_url || "",
      sections,
      readingTime,
      wordCount,
      publishedAt: status === "published" ? new Date().toISOString() : undefined,
      seo: { title: args.seo_title || "", description: args.seo_description || "", canonical: "" },
      social: { ogTitle: args.og_title || "", ogDescription: args.og_description || "", ogImage: args.featured_image_url || "" },
      relationships: [],
    };
    const row = { title, slug, content_type: "blog", status, visibility: "public", featured: false, sort_order: 0, public_route: `/blog/${slug}`, metadata };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/content_registry`, { method: "POST", headers: { ...JSON_HEADERS, Prefer: "return=representation" }, body: JSON.stringify(row) });
    if (!r.ok) throw new Error(`create failed: ${r.status} ${await r.text()}`);
    const created = (await r.json())[0];
    return { id: created.id, slug, status, sections: sections.length, url: `${SITE_ORIGIN}/blog/${slug}`, admin_url: `${SITE_ORIGIN}/admin/content/blog/${created.id}` };
  }

  if (name === "update_article") {
    const rows = await sbSelect(`content_registry?slug=eq.${encodeURIComponent(args.slug)}&content_type=eq.blog&select=*&limit=1`);
    const cur = rows[0];
    if (!cur) throw new Error(`Article not found: ${args.slug}`);
    const meta = { ...(cur.metadata || {}) };
    if (args.excerpt !== undefined) meta.excerpt = args.excerpt;
    if (args.category !== undefined) meta.category = args.category;
    if (Array.isArray(args.tags)) meta.tags = args.tags;
    if (args.featured_image_url !== undefined) { meta.featuredImage = args.featured_image_url; meta.social = { ...(meta.social || {}), ogImage: args.featured_image_url }; }
    if (args.seo_title !== undefined || args.seo_description !== undefined) meta.seo = { ...(meta.seo || {}), title: args.seo_title ?? meta.seo?.title ?? "", description: args.seo_description ?? meta.seo?.description ?? "" };
    if (args.og_title !== undefined || args.og_description !== undefined) meta.social = { ...(meta.social || {}), ogTitle: args.og_title ?? meta.social?.ogTitle ?? "", ogDescription: args.og_description ?? meta.social?.ogDescription ?? "" };
    if (args.body_markdown !== undefined) {
      meta.sections = buildSections(args.body_markdown, args.split_by_heading !== false);
      const s = stats([meta.excerpt || "", ...meta.sections.map((x: any) => x.config.body)].join(" "));
      meta.wordCount = s.wordCount; meta.readingTime = s.readingTime;
    }
    const patch: any = { metadata: meta };
    if (args.title) patch.title = String(args.title).trim();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/content_registry?slug=eq.${encodeURIComponent(args.slug)}`, { method: "PATCH", headers: { ...JSON_HEADERS, Prefer: "return=representation" }, body: JSON.stringify(patch) });
    if (!r.ok) throw new Error(`update failed: ${r.status} ${await r.text()}`);
    return { slug: args.slug, updated: true, url: `${SITE_ORIGIN}/blog/${args.slug}` };
  }

  if (name === "publish_article" || name === "unpublish_article") {
    const publish = name === "publish_article";
    const rows = await sbSelect(`content_registry?slug=eq.${encodeURIComponent(args.slug)}&content_type=eq.blog&select=metadata&limit=1`);
    if (!rows[0]) throw new Error(`Article not found: ${args.slug}`);
    const meta = { ...(rows[0].metadata || {}) };
    if (publish && !meta.publishedAt) meta.publishedAt = new Date().toISOString();
    const patch = { status: publish ? "published" : "draft", visibility: "public", metadata: meta };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/content_registry?slug=eq.${encodeURIComponent(args.slug)}`, { method: "PATCH", headers: { ...JSON_HEADERS, Prefer: "return=representation" }, body: JSON.stringify(patch) });
    if (!r.ok) throw new Error(`${name} failed: ${r.status} ${await r.text()}`);
    return { slug: args.slug, status: patch.status, url: `${SITE_ORIGIN}/blog/${args.slug}` };
  }

  if (name === "upload_image") {
    let bytes: Uint8Array;
    let contentType = "image/png";
    let srcName = args.filename || "image.png";
    if (args.image_url) {
      const ir = await fetch(args.image_url);
      if (!ir.ok) throw new Error(`fetch image failed: ${ir.status}`);
      contentType = ir.headers.get("content-type") || contentType;
      bytes = new Uint8Array(await ir.arrayBuffer());
      try { srcName = args.filename || new URL(args.image_url).pathname.split("/").pop() || srcName; } catch { /* keep */ }
    } else if (args.image_base64) {
      const b64 = String(args.image_base64).replace(/^data:[^;]+;base64,/, "");
      bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } else {
      throw new Error("Provide image_url or image_base64");
    }
    const safe = String(srcName).replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `blog/${Date.now()}_${safe}`;
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { ...SRV_HEADERS, "Content-Type": contentType, "x-upsert": "true" }, body: bytes });
    if (!up.ok) throw new Error(`upload failed: ${up.status} ${await up.text()}`);
    return { public_url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`, bytes: bytes.length, content_type: contentType };
  }

  throw new Error(`Unknown tool: ${name}`);
}

// ---------- JSON-RPC / MCP ----------
function rpcResult(id: any, result: any) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { headers: { ...CORS, "Content-Type": "application/json" } });
}
function rpcError(id: any, code: number, message: string) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), { headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Auth
  const auth = req.headers.get("authorization") || "";
  if (!MCP_TOKEN || auth !== `Bearer ${MCP_TOKEN}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  if (req.method === "GET") {
    // No server-initiated SSE stream in this minimal server.
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  let msg: any;
  try { msg = await req.json(); } catch { return rpcError(null, -32700, "Parse error"); }

  const { id, method, params } = msg || {};

  // Notifications (no id) — just acknowledge.
  if (method && method.startsWith("notifications/")) {
    return new Response(null, { status: 202, headers: CORS });
  }

  if (method === "initialize") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "naiimbsili-cms", version: "1.0.0" },
        },
      }),
      { headers: { ...CORS, "Content-Type": "application/json", "Mcp-Session-Id": crypto.randomUUID() } },
    );
  }

  if (method === "ping") return rpcResult(id, {});

  if (method === "tools/list") return rpcResult(id, { tools: TOOLS });

  if (method === "tools/call") {
    const toolName = params?.name;
    try {
      const out = await callTool(toolName, params?.arguments);
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
    } catch (err) {
      return rpcResult(id, { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true });
    }
  }

  return rpcError(id ?? null, -32601, `Method not found: ${method}`);
});
