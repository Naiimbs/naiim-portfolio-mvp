import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const DIST_DIR = join(process.cwd(), 'dist');
const SITE_URL = (process.env.VITE_SITE_URL || 'https://naiimbsili.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/naim-portrait.jpg`;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const STATIC_ROUTES = [
  { route: '/', title: 'Naïm Bsili — Product Designer & AI Builder', description: 'Portfolio of Naïm Bsili covering product design, UX/UI, AI and automation.' },
  { route: '/about/', title: 'About Naïm Bsili — Product Designer & AI Builder', description: 'Discover Naïm Bsili’s journey, approach and skills in product design and AI solutions.' },
  { route: '/work', title: 'Selected Work — Naïm Bsili', description: 'Case studies and digital products designed and built by Naïm Bsili.' },
  { route: '/resources', title: 'Resources, Skills & Systems — Naïm Bsili', description: 'Reusable resources, skills, templates and systems for designing and building better products.' },
  { route: '/blog', title: 'Blog — Design, AI & Digital Craft — Naïm Bsili', description: 'Articles and analyses about product design, AI, workflows and digital craft.' },
  { route: '/agents/', title: 'AI Agents & Automation Systems — Naïm Bsili', description: 'Explore intelligent agents, n8n workflows, and AI systems built by Naïm Bsili.' },
  { route: '/p/my-journey', title: 'My Journey — Naïm Bsili', description: 'Naïm Bsili’s journey from mechanical engineering to digital product design and AI.' },
  { route: '/work/winni', title: 'WINNI — Product Case Study — Naïm Bsili', description: 'A product case study about WINNI, a QR and NFC recovery experience for lost items.' },
  { route: '/work/assestini', title: 'Assestini — Operational Intelligence Case Study', description: 'An operational intelligence platform case study focused on connected workflows and actionable data.' },
  { route: '/work/cha9a9a', title: 'Cha9a9a — Front-End Integration Case Study', description: 'A case study about translating a Figma direction into a responsive community platform interface.' },
  { route: '/work/career-os', title: 'Career OS — AI Job Search Case Study', description: 'An automated job-search workflow that aggregates opportunities, scores fit, and delivers a focused digest.' },
  { route: '/work/saudi-government', title: 'Saudi Government Services — Case Study', description: 'A digital government services case study focused on clearer journeys and usable service interfaces.' },
  { route: '/work/saudi-banking', title: 'Saudi Banking — Product Case Study', description: 'A Saudi banking case study exploring trust, clarity, and usable digital service experiences.' },
  { route: '/work/saudi-regulatory', title: 'Saudi Regulatory Healthcare — Case Study', description: 'A regulatory healthcare case study focused on evidence, workflows, and decision support.' },
  { route: '/work/dga', title: 'Digital Government Authority — Case Study', description: 'A digital government case study about designing clearer, more reliable public-service experiences.' },
  { route: '/work/mhaf-accessibility/', title: 'MHAF Accessibility — Case Study — Naïm Bsili', description: 'A case study about MHAF Accessibility, an independent product connecting proprietary configuration with a visitor tool.' },
  { route: '/work/naim-copilot/', title: 'Naïm Copilot — Case Study — Naïm Bsili', description: 'An AI copilot prototype for exploring a portfolio and querying published work.' },
  { route: '/agents/naim-copilot/', title: 'Naïm Copilot — AI Agent Case Study', description: 'A personal AI agent connecting memory, knowledge, projects, and actions through a conversational interface.' },
  { route: '/agents/career-os/', title: 'Career OS — Job Search AI Agent', description: 'An automation agent that aggregates job opportunities, removes duplicates, scores fit, and delivers a daily digest.' },
];

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

function upsertMeta(html, selector, tag) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*${selector})[^>]*\\/?>`, 'gi');
  const withoutExisting = html.replace(pattern, '');
  return withoutExisting.replace('</head>', `    ${tag}\n  </head>`);
}

function removeLinks(html, predicate) {
  return html.replace(/<link[^>]*>/gi, (tag) => (predicate(tag) ? '' : tag));
}

function localeCode(locale) {
  return locale === 'fr' ? 'fr_FR' : locale === 'ar' ? 'ar_AR' : 'en_US';
}

function routeForLocale(route, locale) {
  const cleanRoute = route.replace(/^\/(?:fr|ar)(?=\/)/, '') || '/';
  return locale === 'en' ? cleanRoute : `/${locale}${cleanRoute}`;
}

function resolveImage(meta = {}) {
  const imageAssets = Array.isArray(meta.assets)
    ? meta.assets.filter((asset) => asset?.featured === true || /^image\//i.test(asset?.mime_type || '') || /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(asset?.file_url || asset?.url || ''))
    : [];
  const officialAsset = imageAssets.find((asset) => asset?.featured === true) || imageAssets.find((asset) => /editorial|preview|cover|hero|thumbnail/i.test(asset?.name || ''));
  const candidates = [
    meta.social?.ogImage,
    meta.ogImage,
    meta.featured_image,
    meta.featuredImage,
    meta.heroImage,
    officialAsset?.file_url || officialAsset?.url || officialAsset?.preview_url || officialAsset?.image_url,
    imageAssets.find((asset) => asset?.asset_type === 'screenshot')?.file_url,
    ...imageAssets.map((asset) => asset?.file_url || asset?.url),
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

function buildRouteHtml(template, entry, locale = 'en') {
  const meta = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
  const seo = meta.seo && typeof meta.seo === 'object' ? meta.seo : {};
  const route = entry.public_route || `/${entry.content_type === 'blog' ? 'blog' : 'resources'}/${entry.slug}`;
  const localized = locale !== 'en' && meta.i18n?.[locale] && typeof meta.i18n[locale] === 'object' ? meta.i18n[locale] : {};
  const localizedRoute = locale === 'en' ? route : `/${locale}${route.startsWith('/') ? route : `/${route}`}`;
  const canonical = `${SITE_URL}${localizedRoute}`;
  const title = localized.seo_title || localized.seoTitle || localized.title || seo.title || meta.social?.ogTitle || entry.title || 'Naïm Bsili';
  const description = trimDescription(
    localized.seo_description || localized.seoDescription || localized.excerpt || localized.short_description || localized.description || seo.description || meta.social?.ogDescription || meta.excerpt || meta.short_description || meta.description,
    'Naïm Bsili — Product Designer and AI Product Builder.'
  );
  const ogTitle = localized.og_title || localized.ogTitle || localized.title || meta.social?.ogTitle || title;
  const ogDescription = trimDescription(
    localized.og_description || localized.ogDescription || localized.excerpt || meta.social?.ogDescription || description,
    description,
  );
  const image = resolveImage(meta);
  const type = entry.content_type === 'blog' ? 'article' : 'website';
  const bodyTitle = escapeHtml(localized.title || entry.title || title);
  const bodyDescription = escapeHtml(description);
  const alternateLocales = ['en', 'fr', 'ar'];
  let html = template
    .replace(/<html lang="[^"]*" dir="[^"]*">/, `<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)} · Naïm Bsili</title>`)
    .replace('<div id="root"></div>', `<div id="root"><main><h1>${bodyTitle}</h1><p>${bodyDescription}</p></main></div>`);

  html = upsertMeta(html, 'name="description"', `<meta data-rh="true" name="description" content="${escapeHtml(description)}" />`);
  html = upsertMeta(html, 'property="og:type"', `<meta data-rh="true" property="og:type" content="${type}" />`);
  html = upsertMeta(html, 'property="og:title"', `<meta data-rh="true" property="og:title" content="${escapeHtml(ogTitle)}" />`);
  html = upsertMeta(html, 'property="og:description"', `<meta data-rh="true" property="og:description" content="${escapeHtml(ogDescription)}" />`);
  html = upsertMeta(html, 'property="og:image"', `<meta data-rh="true" property="og:image" content="${escapeHtml(image)}" />`);
  html = upsertMeta(html, 'property="og:url"', `<meta data-rh="true" property="og:url" content="${escapeHtml(canonical)}" />`);
  html = upsertMeta(html, 'property="og:locale"', `<meta data-rh="true" property="og:locale" content="${localeCode(locale)}" />`);
  html = upsertMeta(html, 'name="twitter:title"', `<meta data-rh="true" name="twitter:title" content="${escapeHtml(ogTitle)}" />`);
  html = upsertMeta(html, 'name="twitter:description"', `<meta data-rh="true" name="twitter:description" content="${escapeHtml(ogDescription)}" />`);
  html = upsertMeta(html, 'name="twitter:image"', `<meta data-rh="true" name="twitter:image" content="${escapeHtml(image)}" />`);
  html = removeLinks(html, (tag) => /rel=["']canonical["']/i.test(tag) || /rel=["']alternate["']/i.test(tag));
  const alternateLinks = alternateLocales.map((alternateLocale) => (
    `    <link data-rh="true" rel="alternate" hreflang="${alternateLocale}" href="${escapeHtml(`${SITE_URL}${routeForLocale(route, alternateLocale)}`)}" />`
  )).join('\n');
  const alternateOgLocales = alternateLocales
    .filter((alternateLocale) => alternateLocale !== locale)
    .map((alternateLocale) => `    <meta data-rh="true" property="og:locale:alternate" content="${localeCode(alternateLocale)}" />`)
    .join('\n');
  const xDefault = `    <link data-rh="true" rel="alternate" hreflang="x-default" href="${escapeHtml(`${SITE_URL}${routeForLocale(route, 'en')}`)}" />`;
  html = html.replace('</head>', `${alternateOgLocales}\n    <link data-rh="true" rel="canonical" href="${escapeHtml(canonical)}" />\n${alternateLinks}\n${xDefault}\n  </head>`);
  return html;
}

function buildStaticRouteHtml(template, routeEntry) {
  const canonical = `${SITE_URL}${routeEntry.route === '/' ? '/' : routeEntry.route}`;
  let html = template
    .replace(/<html lang="[^"]*" dir="[^"]*">/, '<html lang="en" dir="ltr">')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(routeEntry.title)}</title>`)
    .replace('<div id="root"></div>', `<div id="root"><main><h1>${escapeHtml(routeEntry.title)}</h1><p>${escapeHtml(routeEntry.description)}</p></main></div>`);
  html = upsertMeta(html, 'name="description"', `<meta data-rh="true" name="description" content="${escapeHtml(routeEntry.description)}" />`);
  html = upsertMeta(html, 'property="og:title"', `<meta data-rh="true" property="og:title" content="${escapeHtml(routeEntry.title)}" />`);
  html = upsertMeta(html, 'property="og:description"', `<meta data-rh="true" property="og:description" content="${escapeHtml(routeEntry.description)}" />`);
  html = upsertMeta(html, 'property="og:url"', `<meta data-rh="true" property="og:url" content="${escapeHtml(canonical)}" />`);
  html = removeLinks(html, (tag) => /rel=["']canonical["']/i.test(tag) || /rel=["']alternate["']/i.test(tag));
  return html.replace('</head>', `    <link data-rh="true" rel="canonical" href="${escapeHtml(canonical)}" />\n  </head>`);
}

try {
  const template = await readFile(join(DIST_DIR, 'index.html'), 'utf8');
  for (const routeEntry of STATIC_ROUTES) {
    const outputPath = routeEntry.route === '/'
      ? join(DIST_DIR, 'index.html')
      : join(DIST_DIR, routeEntry.route, 'index.html');
    if (routeEntry.route !== '/') await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, buildStaticRouteHtml(template, routeEntry));
  }
  const entries = await fetchPublicEntries();
  for (const entry of entries) {
    if (!entry?.slug || !entry?.content_type) continue;
    const route = entry.public_route || `/${entry.content_type === 'blog' ? 'blog' : 'resources'}/${entry.slug}`;
    if (!/^\/(blog|resources)\/[^/?#]+$/.test(route)) continue;
    const locales = ['en', ...(Object.keys(entry.metadata?.i18n || {}).filter((locale) => ['ar', 'fr'].includes(locale)))];
    for (const locale of locales) {
      const localizedRoute = locale === 'en' ? route : `/${locale}${route}`;
      const outputPath = join(DIST_DIR, localizedRoute, 'index.html');
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, buildRouteHtml(template, entry, locale));
    }
  }
  console.log(`[seo] Generated ${STATIC_ROUTES.length} static page(s) and ${entries.length} CMS route page(s).`);
} catch (error) {
  console.warn(`[seo] Route page generation skipped: ${error.message}`);
}
