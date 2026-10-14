// Edge function: og-render
// Returns a tiny HTML document with per-article Open Graph / Twitter tags for
// social crawlers (LinkedIn, Facebook, WhatsApp, Twitter/X, Slack, …) that do
// not execute JavaScript. Humans are redirected to the real SPA route.
//
// Caddy routes only known crawler user-agents on /blog/* to this function:
//   rewrite * /og-render?path={uri}
//   reverse_proxy https://<project-ref>.functions.supabase.co
//
// Deploy publicly (no JWT):  supabase functions deploy og-render --no-verify-jwt

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SITE_ORIGIN = "https://naiimbsili.com";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/naim-portrait.jpg`;
const DEFAULT_TITLE = "Naïm Bsili — Product Designer & AI Builder";
const DEFAULT_DESC = "Senior UX/UI Designer & AI Product Builder.";

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absImage(src: string): string {
  if (!src) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(src)) return src;
  return DEFAULT_IMAGE; // bare filenames (hashed build assets) aren't resolvable here
}

function htmlFor(opts: { title: string; description: string; image: string; url: string; type: string }) {
  const { title, description, image, url, type } = opts;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="${esc(type)}" />
<meta property="og:site_name" content="Naïm Bsili" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta http-equiv="refresh" content="0; url=${esc(url)}" />
<script>location.replace(${JSON.stringify(url)});</script>
</head><body><p>Redirecting to <a href="${esc(url)}">${esc(title)}</a>…</p></body></html>`;
}

Deno.serve(async (req: Request) => {
  const reqUrl = new URL(req.url);
  // Original path comes via ?path=/blog/<slug> (set by Caddy rewrite).
  const rawPath = reqUrl.searchParams.get("path") || reqUrl.pathname;
  const cleanPath = rawPath.split("?")[0];
  const blogMatch = cleanPath.match(/^\/blog\/([^/]+)\/?$/);
  const canonicalUrl = `${SITE_ORIGIN}${cleanPath}`;

  // Only blog posts are specialized for now; anything else gets the brand card.
  if (!blogMatch) {
    return new Response(
      htmlFor({ title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url: canonicalUrl, type: "website" }),
      { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } },
    );
  }

  const slug = decodeURIComponent(blogMatch[1]);
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let image = DEFAULT_IMAGE;

  try {
    const api = `${SUPABASE_URL}/rest/v1/content_registry?slug=eq.${encodeURIComponent(slug)}&content_type=eq.blog&status=eq.published&visibility=eq.public&select=title,metadata&limit=1`;
    const res = await fetch(api, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (res.ok) {
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) {
        const meta = row.metadata || {};
        title = row.title || title;
        description = meta.excerpt || meta.seo?.description || description;
        image = absImage(meta.social?.ogImage || meta.featuredImage || "");
      }
    }
  } catch (_err) {
    // fall back to defaults
  }

  return new Response(
    htmlFor({ title, description, image, url: canonicalUrl, type: "article" }),
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } },
  );
});
