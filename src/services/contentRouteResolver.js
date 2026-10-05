/**
 * contentRouteResolver.js
 *
 * Centralizes public route knowledge, route implementation status,
 * canonical route generation, and route mismatch detection across the portfolio.
 *
 * Authoritative boundary for:
 *   - Implemented public routes vs future registered content types
 *   - Canonical route computation per content_type
 *   - Public link safety (never generate broken public links)
 */

export const PUBLIC_ROUTE_REGISTRY = {
  'case-study': {
    basePath: '/work',
    label: 'Case Study',
    implemented: true,
    description: 'Portfolio case study presentation (/work/:slug)',
  },
  page: {
    basePath: '/p',
    label: 'Site Page',
    implemented: true,
    description: 'Dynamic CMS Page (/p/:slug)',
  },
  agent: {
    basePath: '/agents',
    label: 'AI Agent',
    implemented: false,
    description: 'Autonomous AI agent showcase (future)',
  },
  plugin: {
    basePath: '/plugins',
    label: 'Plugin / Tool',
    implemented: false,
    description: 'Figma and workflow tools (future)',
  },
  blog: {
    basePath: '/blog',
    label: 'Blog Article',
    implemented: false,
    description: 'Blog & editorial articles (future)',
  },
  other: {
    basePath: '/p',
    label: 'Other Content',
    implemented: true,
    description: 'Generic content pages (/p/:slug)',
  },
};

/**
 * Normalizes a slug to be URL-safe (lowercase, dashes only).
 */
export function normalizeSlug(slug) {
  if (!slug) return '';
  return String(slug)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Returns the canonical route for a given content type and slug.
 * e.g. ('case-study', 'winni') -> '/work/winni'
 *      ('agent', 'foo')        -> '/agents/foo'
 */
export function getCanonicalRoute(contentType, slug) {
  const cleanType = (contentType || 'case-study').toLowerCase().trim();
  const cleanSlug = normalizeSlug(slug);

  // Top-level canonical routes
  if (cleanType === 'page') {
    if (cleanSlug === 'home' || cleanSlug === 'index') {
      return '/';
    }
    if (cleanSlug === 'about') {
      return '/about';
    }
  }

  const typeConfig = PUBLIC_ROUTE_REGISTRY[cleanType] || PUBLIC_ROUTE_REGISTRY.other;
  const base = typeConfig.basePath;

  if (!cleanSlug) return base;
  return `${base}/${cleanSlug}`;
}

/**
 * Determines whether a given content type or entry has an implemented public route.
 * Accepts either a contentType string or an entry object.
 */
export function isPublicRouteImplemented(entryOrType) {
  if (!entryOrType) return false;
  const contentType =
    typeof entryOrType === 'string'
      ? entryOrType
      : entryOrType.content_type;

  const cleanType = (contentType || '').toLowerCase().trim();
  const config = PUBLIC_ROUTE_REGISTRY[cleanType];
  return Boolean(config && config.implemented);
}

/**
 * Returns the configured or canonical route for an entry.
 * If entry.public_route is set and non-empty, returns it.
 * Otherwise returns getCanonicalRoute(entry.content_type, entry.slug).
 */
export function getContentTypeRoute(entry) {
  if (!entry) return '/work';
  const custom = entry.public_route?.trim();
  if (custom) return custom;
  return getCanonicalRoute(entry.content_type, entry.slug);
}

/**
 * Returns detailed public route status for an entry.
 *
 * Returns:
 * {
 *   contentType: string,
 *   canonicalRoute: string,
 *   route: string,
 *   isImplemented: boolean,
 *   isCanonical: boolean,
 *   hasMismatch: boolean,
 *   mismatchReason: string | null,
 *   statusMessage: string,
 *   label: string,
 * }
 */
export function getPublicRouteStatus(entry) {
  if (!entry) {
    return {
      contentType: 'case-study',
      canonicalRoute: '/work',
      route: '/work',
      isImplemented: false,
      isCanonical: true,
      hasMismatch: false,
      mismatchReason: null,
      statusMessage: 'No entry provided.',
      label: 'Unknown',
    };
  }

  const contentType = (entry.content_type || 'case-study').toLowerCase().trim();
  const typeConfig = PUBLIC_ROUTE_REGISTRY[contentType] || PUBLIC_ROUTE_REGISTRY.other;
  const canonicalRoute = getCanonicalRoute(contentType, entry.slug);
  const route = entry.public_route?.trim() || canonicalRoute;
  const isImplemented = Boolean(typeConfig.implemented);
  const isCanonical = !entry.public_route || entry.public_route.trim() === canonicalRoute;

  // Detect route mismatch: e.g. case-study not starting with /work/ or other types pointing to /work/
  let hasMismatch = false;
  let mismatchReason = null;

  if (entry.public_route && entry.public_route.trim() !== canonicalRoute) {
    if (contentType === 'case-study' && !entry.public_route.startsWith('/work/')) {
      hasMismatch = true;
      mismatchReason = `Case-study content should normally use ${canonicalRoute}. Current route: ${entry.public_route}`;
    } else if (contentType !== 'case-study' && entry.public_route.startsWith('/work/')) {
      hasMismatch = true;
      mismatchReason = `Non-case-study content should not use /work prefix. Canonical route is ${canonicalRoute}. Current route: ${entry.public_route}`;
    }
  }

  let statusMessage;
  if (isImplemented) {
    statusMessage = 'Public route active';
  } else {
    statusMessage = 'The content type is registered, but its public page has not been implemented yet.';
  }

  return {
    contentType,
    canonicalRoute,
    route,
    isImplemented,
    isCanonical,
    hasMismatch,
    mismatchReason,
    statusMessage,
    label: typeConfig.label,
  };
}
