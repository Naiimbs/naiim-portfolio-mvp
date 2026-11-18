// Public visibility policy for content intentionally kept out of the portfolio surface.
// Admin CMS routes remain available; this file only governs visitor-facing routes and listings.
export const HIDDEN_PUBLIC_SLUGS = new Set(['career-os', 'naim-copilot']);

export function isHiddenPublicSlug(slug = '') {
  return HIDDEN_PUBLIC_SLUGS.has(String(slug).trim().toLowerCase());
}

export function isHiddenPublicRoute(href = '') {
  const path = String(href || '').trim().split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
  return path === '/agents' || path.startsWith('/agents/') || isHiddenPublicSlug(path.split('/').filter(Boolean).pop() || '');
}
