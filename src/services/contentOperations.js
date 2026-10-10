/**
 * Content Operations & Editorial CMS Service (Phase 19)
 *
 * Provides:
 * 1. Editorial Lifecycle management (Draft -> In Review -> Ready -> Published -> Archived)
 * 2. Status transition validation and safety gating
 * 3. Content Quality calculation (blocking errors vs advisories/warnings)
 * 4. Reusable SEO & Social metadata resolver with smart fallbacks
 * 5. Content Relationship management (preventing self-reference and duplicates)
 * 6. Content Duplication with safe unique identity and reset publication timestamps
 * 7. Unified public Blog catalog and single post resolution with preview support
 * 8. Authoritative fallback data store for resilient local development
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  getContentRegistry,
  getAdminContentRegistry,
  getContentRegistryEntryById,
  createContentRegistryEntry,
  updateContentRegistryEntry,
  deleteContentRegistryEntry,
  checkSlugAvailable,
  getDeletedRegistryIds,
} from './contentRegistry.js';
import { getCanonicalRoute, normalizeSlug } from './contentRouteResolver.js';

export const EDITORIAL_STATUSES = ['draft', 'in_review', 'ready', 'published', 'archived'];

export const CONTENT_TYPES = ['blog', 'case-study', 'page', 'agent', 'plugin', 'other'];

export const STATUS_LABELS = {
  draft: 'Draft',
  in_review: 'In Review',
  ready: 'Ready',
  published: 'Published',
  archived: 'Archived',
};

export const STATUS_BADGE_VARIANTS = {
  draft: 'secondary',
  in_review: 'info',
  ready: 'primary',
  published: 'success',
  archived: 'dark',
};

/**
 * Valid Editorial Status Transitions
 */
export const VALID_STATUS_TRANSITIONS = {
  draft: ['in_review', 'ready'],
  in_review: ['draft', 'ready'],
  ready: ['draft', 'published'],
  published: ['archived'],
  archived: ['draft'],
};

/**
 * Validates whether a status transition is permitted by editorial rules
 */
export function isValidStatusTransition(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
}

/**
 * Returns available next status transitions for a given status
 */
export function getNextAllowedTransitions(currentStatus) {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * In-memory fallback editorial store for Phase 19 blog articles & items
 */
const localEditorialStore = [
  {
    id: 'c1900001-0000-4000-a000-000000000001',
    title: 'How I Built My AI Copilot: Architecture & Design Decisions',
    slug: 'how-i-built-my-ai-copilot',
    content_type: 'blog',
    status: 'published',
    visibility: 'public',
    featured: true,
    sort_order: 10,
    public_route: '/blog/how-i-built-my-ai-copilot',
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-15T10:00:00Z',
    published_at: '2026-09-15T10:00:00Z',
    metadata: {
      excerpt: 'A deep dive into building an autonomous portfolio copilot using React, custom MCP tools, and semantic embeddings.',
      author: 'Naïm Bsili',
      category: 'AI & Architecture',
      tags: ['AI Copilot', 'MCP', 'Product Design', 'Architecture'],
      featuredImage: 'cover-copilot-naim-DXZL9efD.png',
      featured_image: 'cover-copilot-naim-DXZL9efD.png',
      featured_image_alt: 'AI Copilot architecture and tool orchestration diagram',
      readingTime: '5 min read',
      wordCount: 1250,
      publishedAt: '2026-09-15T10:00:00Z',
      seo: {
        title: 'How I Built My AI Copilot — Naïm Bsili',
        description: 'A deep dive into building an autonomous portfolio copilot with low latency and real-time tool orchestration.',
        canonical: '/blog/how-i-built-my-ai-copilot',
      },
      social: {
        ogTitle: 'How I Built My AI Copilot: Architecture & Design Decisions',
        ogDescription: 'A deep dive into building an autonomous portfolio copilot using React and MCP tools.',
        ogImage: 'cover-copilot-naim-DXZL9efD.png',
      },
      related_content: [
        {
          id: 'winni-case-study',
          type: 'case-study',
          title: 'WINNI — Physical-to-Digital Identity',
          slug: 'winni',
          public_route: '/work/winni',
        },
      ],
      relationships: [
        {
          id: 'winni-case-study',
          type: 'case-study',
          title: 'WINNI — Physical-to-Digital Identity',
          slug: 'winni',
          public_route: '/work/winni',
        },
      ],
      sections: [
        {
          id: 'sec-blog-1-hero',
          section_type: 'hero',
          is_visible: true,
          sort_order: 10,
          config: {
            title: 'How I Built My AI Copilot',
            subtitle: 'Architecture & Design Decisions for an Autonomous Portfolio Assistant',
            eyebrow: 'AI ENGINEERING & DESIGN',
          },
        },
        {
          id: 'sec-blog-1-body',
          section_type: 'rich_text',
          is_visible: true,
          sort_order: 20,
          config: {
            title: 'The Challenge: Moving Beyond Generic Chatbots',
            content:
              'Most portfolio chat interfaces are simple ChatGPT wrappers that hallucinate facts. When designing Naïm Copilot, I set a strict requirement: it needed to query real local project data, verify case study metrics, and answer client inquiries with authoritative precision.',
          },
        },
        {
          id: 'sec-blog-1-metrics',
          section_type: 'metrics',
          is_visible: true,
          sort_order: 30,
          config: {
            metrics: [
              { value: '< 250ms', label: 'Average Query Latency' },
              { value: '100%', label: 'Fact Verification Rate' },
              { value: '12+', label: 'Registered MCP Tools' },
            ],
          },
        },
        {
          id: 'sec-blog-1-conclusion',
          section_type: 'rich_text',
          is_visible: true,
          sort_order: 40,
          config: {
            title: 'Key Takeaways for Designers Building with AI',
            content:
              'Designers who master low-code orchestration, prompt boundaries, and tool contracts can build functional prototypes in days rather than months. Copilot is living proof of that design-engineering synergy.',
          },
        },
      ],
    },
  },
  {
    id: 'c1900002-0000-4000-a000-000000000002',
    title: 'Next-Generation Design Systems: Tokens, Multi-Brand & Autonomous QA',
    slug: 'next-generation-design-systems',
    content_type: 'blog',
    status: 'draft',
    visibility: 'private',
    featured: false,
    sort_order: 20,
    public_route: '/blog/next-generation-design-systems',
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-20T14:30:00Z',
    metadata: {
      excerpt: 'How AI agents and headless design token pipelines are shifting the responsibilities of modern product design teams.',
      author: 'Naïm Bsili',
      category: 'Design Systems',
      tags: ['Design Systems', 'Tokens', 'Figma', 'Automation'],
      featuredImage: 'The-work-behind-the-interface-BSelJoQv.png',
      featured_image: 'The-work-behind-the-interface-BSelJoQv.png',
      readingTime: '4 min read',
      wordCount: 950,
      seo: {
        title: 'Next-Gen Design Systems: Tokens & Autonomous QA',
        description: 'Explore headless design token pipelines and autonomous QA in multi-brand systems.',
        canonical: '/blog/next-generation-design-systems',
      },
      social: {
        ogTitle: 'Next-Gen Design Systems: Tokens & Autonomous QA',
        ogDescription: 'Explore headless design token pipelines and autonomous QA in multi-brand systems.',
        ogImage: 'The-work-behind-the-interface-BSelJoQv.png',
      },
      related_content: [],
      sections: [
        {
          id: 'sec-blog-2-hero',
          section_type: 'hero',
          is_visible: true,
          sort_order: 10,
          config: {
            title: 'Next-Gen Design Systems: Tokens & Autonomous QA',
            subtitle: 'How headless tokens and AI agents transform cross-platform consistency',
            eyebrow: 'SYSTEMS & AUTOMATION',
          },
        },
        {
          id: 'sec-blog-2-body',
          section_type: 'rich_text',
          is_visible: true,
          sort_order: 20,
          config: {
            title: 'The Token Revolution',
            content:
              'Design systems used to be static documentation websites. Today they are compiled data structures consumed by React, Swift, Kotlin, and Figma variables simultaneously.',
          },
        },
      ],
    },
  },
];

export const FALLBACK_BLOG_POSTS = localEditorialStore;

/**
 * Calculates Content Quality with blocking errors vs recommendations
 */
export function calculateContentQuality(item, sections = []) {
  if (!item) {
    return {
      isReady: false,
      isReadyToPublish: false,
      score: 0,
      status: 'ERROR',
      blockingErrors: ['Content item is undefined.'],
      warnings: [],
      passedChecks: [],
    };
  }

  const blockingErrors = [];
  const warnings = [];
  const passedChecks = [];

  const meta = item.metadata || {};

  // 1. Title Check (BLOCKING)
  if (!item.title?.trim()) {
    blockingErrors.push('Missing title: A descriptive title is required for publication.');
  } else {
    passedChecks.push('Title is valid and present.');
  }

  // 2. Slug Check (BLOCKING)
  const normSlug = normalizeSlug(item.slug);
  if (!normSlug) {
    blockingErrors.push('Missing slug: A URL slug is required.');
  } else if (normSlug.length < 3) {
    blockingErrors.push('Slug too short: Must be at least 3 characters.');
  } else {
    passedChecks.push(`Valid URL slug (/${normSlug}).`);
  }

  // 3. Content Body / Sections Check (BLOCKING)
  const itemSections = Array.isArray(sections) && sections.length > 0 ? sections : meta.sections || [];
  const visibleSections = itemSections.filter((s) => s.is_visible !== false);
  const hasBody = Boolean(meta.body?.trim());
  const hasExcerpt = Boolean(meta.excerpt?.trim());

  if (visibleSections.length === 0 && !hasBody) {
    blockingErrors.push('Missing content: Content requires at least one visible section or body text.');
  } else {
    passedChecks.push(`${visibleSections.length || 1} content section(s)/body defined.`);
  }

  // 4. Featured Image (ADVISORY)
  const hasImage = Boolean(meta.featured_image || meta.featuredImage || meta.heroImage || meta.image);
  if (!hasImage) {
    warnings.push('Missing featured image: Recommended for social preview cards.');
  } else {
    passedChecks.push('Featured image is defined.');
    if (meta.featured_image_alt === '') {
      warnings.push('Missing image alt text: Add alt description for accessibility.');
    }
  }

  // 5. Excerpt Check (ADVISORY)
  if (!hasExcerpt) {
    warnings.push('Missing summary excerpt: Recommended for catalog search listings.');
  } else {
    passedChecks.push('Summary excerpt is present.');
  }

  // 6. SEO Metadata Checks (ADVISORY)
  const seo = meta.seo || {};
  if (!seo.metaTitle?.trim() && !seo.title?.trim()) {
    warnings.push('Missing custom SEO title: Will fall back to content title.');
  } else {
    passedChecks.push('SEO title configured.');
  }

  if (!seo.metaDescription?.trim() && !seo.description?.trim()) {
    warnings.push('Missing custom SEO description: Will fall back to excerpt.');
  } else {
    passedChecks.push('SEO description configured.');
  }

  // Calculate score (0 to 100)
  let score = 100;
  score -= blockingErrors.length * 35;
  score -= warnings.length * 10;
  score = Math.max(0, Math.min(100, score));

  const isReady = blockingErrors.length === 0;

  return {
    isReady,
    isReadyToPublish: isReady,
    score,
    status: blockingErrors.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARNING' : 'PASS',
    blockingErrors,
    warnings,
    passedChecks,
  };
}

/**
 * Reusable SEO resolver with multi-layer fallback rules
 */
export function resolveContentSeo(item, siteSettings = {}) {
  if (!item) return {};

  const meta = item.metadata || {};
  const explicitSeo = meta.seo || {};

  const title =
    explicitSeo.metaTitle ||
    explicitSeo.title ||
    (item.title ? `${item.title} | Naïm Bsili` : 'Naïm Bsili | Product Designer & AI Builder');

  const description =
    explicitSeo.metaDescription ||
    explicitSeo.description ||
    meta.excerpt ||
    siteSettings.description ||
    'Portfolio of Naïm Bsili — Product Designer & AI Systems Builder.';

  const canonical =
    explicitSeo.canonical ||
    item.public_route ||
    (item.slug ? getCanonicalRoute(item.content_type || 'blog', item.slug) : '/');

  const ogImage =
    meta.social?.ogImage ||
    explicitSeo.ogImage ||
    meta.featured_image ||
    meta.featuredImage ||
    siteSettings.ogImage ||
    'https://naimbsili.com/assets/og-default.png';

  const ogTitle = meta.social?.ogTitle || explicitSeo.ogTitle || title;
  const ogDescription = meta.social?.ogDescription || explicitSeo.ogDescription || description;

  return {
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    robots: explicitSeo.robots || 'index, follow',
  };
}

/**
 * Manages Content Relationships (prevents self-reference and duplicates)
 */
export function addContentRelationship(sourceItem, targetItem) {
  if (!sourceItem || !targetItem) return sourceItem;
  if (String(sourceItem.id) === String(targetItem.id)) {
    return sourceItem; // Prevent self-reference
  }

  const meta = { ...(sourceItem.metadata || {}) };
  const existingRel = Array.isArray(meta.related_content)
    ? [...meta.related_content]
    : Array.isArray(meta.relationships)
    ? [...meta.relationships]
    : [];

  // Prevent duplicate
  if (existingRel.some((r) => String(r.id) === String(targetItem.id))) {
    return sourceItem;
  }

  const newRel = {
    id: targetItem.id,
    type: targetItem.content_type || 'content',
    title: targetItem.title || 'Untitled',
    slug: targetItem.slug || '',
    public_route: targetItem.public_route || getCanonicalRoute(targetItem.content_type, targetItem.slug),
  };

  const updated = [...existingRel, newRel];
  meta.related_content = updated;
  meta.relationships = updated;
  return { ...sourceItem, metadata: meta };
}

/**
 * Removes a content relationship by target item ID
 */
export function removeContentRelationship(sourceItem, targetId) {
  if (!sourceItem || !targetId) return sourceItem;
  const meta = { ...(sourceItem.metadata || {}) };
  const existingRel = Array.isArray(meta.related_content)
    ? meta.related_content
    : Array.isArray(meta.relationships)
    ? meta.relationships
    : [];

  const updated = existingRel.filter((r) => String(r.id) !== String(targetId));
  meta.related_content = updated;
  meta.relationships = updated;
  return { ...sourceItem, metadata: meta };
}

/**
 * Duplicates a content item with safe identity and reset publication timestamps
 */
export function duplicateContent(sourceItem, options = {}) {
  if (!sourceItem) throw new Error('Cannot duplicate null content item.');

  const baseSlug = normalizeSlug(sourceItem.slug || 'copy');
  const newSlug = `${baseSlug}-copy`;

  const meta = JSON.parse(JSON.stringify(sourceItem.metadata || {}));
  delete meta.publishedAt;
  delete meta.seo?.canonical;

  if (Array.isArray(meta.sections)) {
    meta.sections = meta.sections.map((sec, idx) => ({
      ...sec,
      id: `sec-clone-${Date.now()}-${idx}`,
    }));
  }

  const duplicatedItem = {
    ...sourceItem,
    id: `dup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: `${sourceItem.title} (Copy)`,
    slug: newSlug,
    content_type: sourceItem.content_type || 'blog',
    status: 'draft',
    visibility: 'private',
    featured: false,
    sort_order: (sourceItem.sort_order || 0) + 1,
    published_at: null,
    public_route: getCanonicalRoute(sourceItem.content_type || 'blog', newSlug),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: meta,
  };

  if (options.persist && isSupabaseConfigured) {
    createContentRegistryEntry(duplicatedItem);
  }

  return duplicatedItem;
}

/**
 * Fetch all published & public blog posts (Public Blog Catalog)
 */
export function getPublishedBlogPosts() {
  const published = localEditorialStore
    .filter((p) => p.content_type === 'blog' && p.status === 'published' && p.visibility === 'public')
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const result = [...published];
  result.data = published;
  result.error = null;
  result.source = 'local_fallback';

  if (!isSupabaseConfigured || !supabase) {
    const p = Promise.resolve(result);
    Object.assign(p, result);
    return p;
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('content_registry')
        .select('*')
        .eq('content_type', 'blog')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return result;
      }
      const res = [...data];
      res.data = data;
      res.error = null;
      res.source = 'supabase';
      return res;
    } catch {
      return result;
    }
  })();

  Object.assign(promise, result);
  return promise;
}

/**
 * Fetch a single blog post by slug with preview support (supports Supabase & Local Fallbacks)
 */
export function getBlogPostBySlug(slug, optionsOrPreview = {}) {
  const isPreview = typeof optionsOrPreview === 'boolean' ? optionsOrPreview : Boolean(optionsOrPreview?.isPreview);
  if (!slug) {
    return null;
  }

  const cleanSlug = normalizeSlug(slug);

  // 1. In preview mode, first check for active editor draft saved in sessionStorage
  if (isPreview && typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`cms_preview_blog_${cleanSlug}`) ||
                     sessionStorage.getItem('cms_preview_blog_latest');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (normalizeSlug(parsed.slug) === cleanSlug || !parsed.slug || cleanSlug === 'draft')) {
          const res = { ...parsed, data: parsed, error: null, notFound: false, source: 'session_preview' };
          const p = Promise.resolve(res);
          Object.assign(p, res);
          return p;
        }
      }
    } catch {
      // Ignore parse/storage errors
    }
  }

  // 2. Check local fallback store
  const fallback = localEditorialStore.find(
    (p) => normalizeSlug(p.slug) === cleanSlug || String(p.id) === String(slug)
  );

  // 3. Query Supabase if configured
  if (isSupabaseConfigured && supabase) {
    const promise = (async () => {
      try {
        let query = supabase
          .from('content_registry')
          .select('*')
          .eq('content_type', 'blog')
          .eq('slug', cleanSlug);

        if (!isPreview) {
          query = query.eq('status', 'published');
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          const res = { ...data, data, error: null, notFound: false, source: 'supabase' };
          return res;
        }
      } catch {
        // Fall back to local editorial store on error
      }

      if (fallback && (fallback.status === 'published' || isPreview)) {
        return { ...fallback, data: fallback, error: null, notFound: false, source: 'local_fallback' };
      }
      return null;
    })();

    const syncFound = fallback && (fallback.status === 'published' || isPreview)
      ? { ...fallback, data: fallback, error: null, notFound: false, source: 'local_fallback' }
      : null;

    if (syncFound) {
      Object.assign(promise, syncFound);
    }
    return promise;
  }

  // 4. Supabase unconfigured: use local fallback store
  if (!fallback) {
    return null;
  }

  if (fallback.status !== 'published' && !isPreview) {
    return null;
  }

  const result = { ...fallback, data: fallback, error: null, notFound: false, source: 'local_fallback' };
  const p = Promise.resolve(result);
  Object.assign(p, result);
  return p;
}

/**
 * Calculates estimated reading time based on 200 words per minute
 */
export function calculateReadingTime(text = '') {
  if (!text || typeof text !== 'string') return 1;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Formats reading time display
 */
export function formatReadingTime(mins = 1) {
  return `${mins} min read`;
}

/**
 * Validates blog draft inputs
 */
export function validateBlogDraft(data = {}) {
  const errors = {};
  if (!data.title || !data.title.trim()) {
    errors.title = 'Title is required';
  }
  if (!data.slug || !data.slug.trim()) {
    errors.slug = 'Slug is required';
  } else if (!/^[a-z0-9-]+$/.test(data.slug.trim())) {
    errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Audits full editorial content inventory for health and integrity
 */
export function checkContentIntegrity(items = []) {
  const duplicateSlugs = [];
  const missingSlugs = [];
  const invalidStatuses = [];
  const seenSlugs = new Set();

  for (const item of items) {
    if (!item.slug || !item.slug.trim()) {
      missingSlugs.push(item.id || 'unknown');
    } else {
      const norm = normalizeSlug(item.slug);
      if (seenSlugs.has(norm)) {
        duplicateSlugs.push(norm);
      } else {
        seenSlugs.add(norm);
      }
    }

    if (!EDITORIAL_STATUSES.includes(item.status)) {
      invalidStatuses.push(item.id || 'unknown');
    }
  }

  const issuesCount = duplicateSlugs.length + missingSlugs.length + invalidStatuses.length;

  return {
    totalItems: items.length,
    duplicateSlugs,
    missingSlugs,
    invalidStatuses,
    issuesCount,
    isHealthy: issuesCount === 0,
  };
}

/**
 * Editorial summary metrics across all content types
 */
export function getEditorialSummary(items = []) {
  const counts = {
    total: items.length,
    draft: 0,
    in_review: 0,
    ready: 0,
    published: 0,
    archived: 0,
    byType: {},
  };

  items.forEach((item) => {
    if (counts[item.status] !== undefined) {
      counts[item.status]++;
    }
    const t = item.content_type;
    if (counts.byType[t] !== undefined) {
      counts.byType[t]++;
    } else {
      counts.byType[t] = 1;
    }
  });

  return counts;
}

/**
 * Safely transitions content status with publishing readiness validation
 */
export async function transitionContentStatus(id, newStatus, currentItem = null) {
  if (!EDITORIAL_STATUSES.includes(newStatus)) {
    return { data: null, error: new Error(`Invalid status "${newStatus}".`) };
  }

  let item = currentItem;
  if (!item) {
    const res = await getContentRegistryEntryById(id);
    item = res.data;
  }

  if (!item) {
    return { data: null, error: new Error('Content item not found.') };
  }

  if (!isValidStatusTransition(item.status, newStatus)) {
    return {
      data: null,
      error: new Error(`Transition from "${item.status}" to "${newStatus}" is not permitted by editorial rules.`),
    };
  }

  // Publishing Safety Gate: if transitioning to 'published', run Quality checks
  if (newStatus === 'published') {
    const quality = calculateContentQuality(item);
    if (!quality.isReady) {
      const errMsgs = quality.blockingErrors.join(' ');
      return {
        data: null,
        error: new Error(`Cannot publish content. Blocking issues: ${errMsgs}`),
      };
    }
  }

  const updates = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'published' && !item.metadata?.publishedAt) {
    updates.metadata = {
      ...(item.metadata || {}),
      publishedAt: new Date().toISOString(),
    };
  }

  return updateContentRegistryEntry(id, updates);
}

/**
 * Retrieves the comprehensive content inventory with filters and search
 */
export async function getContentInventory({ search = '', type = 'all', status = 'all' } = {}) {
  const regRes = await getAdminContentRegistry();
  let items = regRes.data || [];
  const deletedIds = getDeletedRegistryIds();

  // Merge in local fallback items if not present in registry and not deleted
  const existingSlugs = new Set(items.map((i) => i.slug));
  localEditorialStore.forEach((fallback) => {
    if (!existingSlugs.has(fallback.slug) && !deletedIds.has(String(fallback.id))) {
      items.push(fallback);
      existingSlugs.add(fallback.slug);
    }
  });

  // Ensure deleted items are completely excluded
  if (deletedIds.size > 0) {
    items = items.filter((item) => !deletedIds.has(String(item.id)));
  }

  if (type && type !== 'all') {
    items = items.filter((item) => (item.content_type || 'other') === type);
  }

  if (status && status !== 'all') {
    items = items.filter((item) => item.status === status);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    items = items.filter((item) => {
      const meta = item.metadata || {};
      return (
        item.title?.toLowerCase().includes(q) ||
        item.slug?.toLowerCase().includes(q) ||
        meta.excerpt?.toLowerCase().includes(q) ||
        meta.category?.toLowerCase().includes(q) ||
        (Array.isArray(meta.tags) && meta.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }

  // Sort by updated_at descending
  items.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  return { data: items, error: null };
}

/**
 * Calculates editorial operational metrics across the inventory
 */
export async function getContentMetrics() {
  const invRes = await getContentInventory();
  const items = invRes.data || [];

  const summary = getEditorialSummary(items);
  let healthy = 0;
  let warnings = 0;
  let errors = 0;

  items.forEach((item) => {
    const q = calculateContentQuality(item);
    if (q.status === 'ERROR') errors++;
    else if (q.status === 'WARNING') warnings++;
    else healthy++;
  });

  return {
    ...summary,
    healthy,
    warnings,
    errors,
  };
}
