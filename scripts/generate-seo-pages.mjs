import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const DIST_DIR = join(process.cwd(), 'dist');
const SITE_URL = (process.env.VITE_SITE_URL || 'https://naiimbsili.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/naim-portrait.jpg`;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function absoluteUrl(value) {
  if (!value) return DEFAULT_IMAGE;
  try {
    return new URL(value, `${SITE_URL}/`).toString();
  } catch {
    return DEFAULT_IMAGE;
  }
}

function textFromMarkdown(value = '') {
  return String(value)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimDescription(value, fallback) {
  const text = textFromMarkdown(value || fallback);
  return text.length > 160 ? `${text.slice(0, 157).trim()}...` : text;
}

function resolveImage(meta = {}) {
  const candidates = [
    meta.social?.ogImage,
    meta.ogImage,
    meta.featured_image,
    meta.featuredImage,
    meta.heroImage,
    ...(Array.isArray(meta.assets) ? meta.assets.map((asset) => asset?.file_url || asset?.url) : []),
  ];
  const image = candidates.find((candidate) => typeof candidate === 'string' && /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(candidate));
  return absoluteUrl(image);
}

async function fetchPublicEntries() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[seo] Supabase build variables are missing; no route pages generated.');
    return [];
  }
  const query = new URL('/rest/v1/content_registry', `${SUPABASE_URL.replace(/\/$/, '')}/`);
  query.searchParams.set('select', 'title,slug,content_type,public_route,metadata');
  query.searchParams.set('status', 'eq.published');
  query.searchParams.set('visibility', 'eq.public');
  query.searchParams.set('content_type', 'in.(resource,blog)');
  query.searchParams.set('limit', '500');
  const response = await fetch(query, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
  return response.json();
}

function buildRouteHtml(template, entry) {
  const meta = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
  const seo = meta.seo && typeof meta.seo === 'object' ? meta.seo : {};
  const route = entry.public_route || `/${entry.content_type === 'blog' ? 'blog' : 'resources'}/${entry.slug}`;
  const canonical = `${SITE_URL}${route.startsWith('/') ? route : `/${route}`}`;
  const title = seo.title || meta.social?.ogTitle || entry.title || 'Naïm Bsili';
  const description = trimDescription(
    seo.description || meta.social?.ogDescription || meta.excerpt || meta.short_description || meta.description,
    'Naïm Bsili — Product Designer and AI Product Builder.'
  );
  const image = resolveImage(meta);
  const type = entry.content_type === 'blog' ? 'article' : 'website';
  const bodyTitle = escapeHtml(entry.title || title);
  const bodyDescription = escapeHtml(description);
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)} · Naïm Bsili</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:type"[^>]*\/>/, `<meta property="og:type" content="${type}" />`)
    .replace(/<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${escapeHtml(title)} · Naïm Bsili" />`)
    .replace(/<meta property="og:description"[^>]*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:image"[^>]*\/>/, `<meta property="og:image" content="${escapeHtml(image)}" />`)
    .replace(/<meta property="og:url"[^>]*\/>/, `<meta property="og:url" content="${escapeHtml(canonical)}" />`)
    .replace(/<meta name="twitter:title"[^>]*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)} · Naïm Bsili" />`)
    .replace(/<meta name="twitter:description"[^>]*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="twitter:image"[^>]*\/>/, `<meta name="twitter:image" content="${escapeHtml(image)}" />`)
    .replace(/<link rel="icon" type="image\/jpeg" href="\/naim-portrait\.jpg"\s*\/>/, (match) => `${match}\n    <link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace('<div id="root"></div>', `<div id="root"><main><h1>${bodyTitle}</h1><p>${bodyDescription}</p></main></div>`);
}

try {
  const template = await readFile(join(DIST_DIR, 'index.html'), 'utf8');
  const entries = await fetchPublicEntries();
  for (const entry of entries) {
    if (!entry?.slug || !entry?.content_type) continue;
    const route = entry.public_route || `/${entry.content_type === 'blog' ? 'blog' : 'resources'}/${entry.slug}`;
    if (!/^\/(blog|resources)\/[^/?#]+$/.test(route)) continue;
    const outputPath = join(DIST_DIR, route, 'index.html');
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, buildRouteHtml(template, entry));
  }
  console.log(`[seo] Generated ${entries.length} route-specific preview page(s).`);
} catch (error) {
  console.warn(`[seo] Route page generation skipped: ${error.message}`);
}
