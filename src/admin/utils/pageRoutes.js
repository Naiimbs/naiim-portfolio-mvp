/**
 * Central source of truth for how CMS `pages` records map to the live site.
 *
 * The `pages` table holds records of different natures. Not all of them are
 * driven by the CMS section builder, so the Site Pages inventory and the Page
 * editor must label them honestly to stay synchronized with what visitors
 * actually see:
 *
 *  - SECTION-LIVE → live site renders their published sections and the builder
 *                   controls the live page (home, work, about, and any custom
 *                   /p/:slug page).
 *  - CODE-OWNED   → live page is built in React / the Content Registry, NOT
 *                   from the section builder (blog, agents). Editing sections
 *                   here does NOT change the live page.
 *  - PLACEHOLDER  → "coming soon" stub route with no real content (copilot,
 *                   plugins).
 *  - REDIRECT     → permanently redirects elsewhere (case-studies → /work).
 *
 * Hiding and labelling live here so AdminPages and AdminPageEditor agree.
 */

// Live page built in code / the Content Registry, not from CMS sections.
// The section builder is informational only for these slugs.
export const CODE_OWNED_SLUGS = ['blog', 'agents'];

// Placeholder "coming soon" routes with no real content.
export const PLACEHOLDER_SLUGS = ['copilot', 'plugins'];

// Slugs that only redirect to another route.
export const REDIRECT_SLUGS = ['case-studies'];

// Pages hidden from the Site Pages inventory: placeholders (no content to
// manage) and pure redirects (nothing to edit).
export const HIDDEN_INVENTORY_SLUGS = [...PLACEHOLDER_SLUGS, ...REDIRECT_SLUGS];

// Slugs whose live page is NOT produced by the section builder. Everything
// else (home, work, about, custom /p/:slug) IS section-driven.
const NON_SECTION_LIVE_SLUGS = [
  ...CODE_OWNED_SLUGS,
  ...PLACEHOLDER_SLUGS,
  ...REDIRECT_SLUGS,
];

/**
 * Resolve the canonical public route for a page slug, matching the real routes
 * declared in src/App.jsx.
 */
export function resolvePageRoute(slug) {
  if (!slug) return '/';
  const s = String(slug).toLowerCase();
  if (s === 'home' || s === 'index') return '/';
  if (s === 'about') return '/about';
  if (s === 'work') return '/work';
  if (s === 'agents') return '/agents';
  if (s === 'blog') return '/blog';
  if (s === 'copilot') return '/copilot';
  if (s === 'plugins') return '/plugins';
  if (s === 'case-studies') return '/work';
  return `/p/${s}`;
}

export function isCodeOwnedSlug(slug) {
  return CODE_OWNED_SLUGS.includes(String(slug || '').toLowerCase());
}

export function isPlaceholderSlug(slug) {
  return PLACEHOLDER_SLUGS.includes(String(slug || '').toLowerCase());
}

export function isHiddenFromInventory(slug) {
  return HIDDEN_INVENTORY_SLUGS.includes(String(slug || '').toLowerCase());
}

/**
 * Whether the section builder actually controls the live page for this slug.
 * home/work/about and custom /p/:slug → true. blog/agents/placeholders/
 * redirects → false (editor is informational only, nothing it publishes
 * reaches the live page).
 */
export function isSectionBuilderLive(slug) {
  return !NON_SECTION_LIVE_SLUGS.includes(String(slug || '').toLowerCase());
}
