import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { resolveAsset, DEFAULT_LOGO_MARKS } from './assetRegistry.js';
import { getContentTypeRoute, isPublicRouteImplemented } from './contentRouteResolver.js';
import { normalizeCaseStudyContent } from './caseStudyRegistryMigration.js';


/**
 * Fetch published & public registry entries (public frontend read).
 */
export async function getContentRegistry({ contentType = null, limit = null } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null, source: 'unconfigured' };
  }

  try {
    let query = supabase
      .from('content_registry')
      .select('*')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('sort_order', { ascending: true });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[contentRegistry] Error fetching public registry:', error);
      return { data: [], error };
    }
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[contentRegistry] Network error:', err);
    return { data: [], error: err };
  }
}

/**
 * Fetch all registry entries for Admin CMS (includes drafts, archived, private).
 */
export async function getAdminContentRegistry({ contentType = null, status = null, search = '' } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: new Error('Supabase is not configured. Add credentials in .env'), source: 'unconfigured' };
  }

  try {
    let query = supabase
      .from('content_registry')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (contentType && contentType !== 'all') {
      query = query.eq('content_type', contentType);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error };
    }

    let results = data || [];
    const deletedIds = getDeletedRegistryIds();
    if (deletedIds.size > 0) {
      results = results.filter((item) => !deletedIds.has(String(item.id)));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.slug?.toLowerCase().includes(q) ||
          item.public_route?.toLowerCase().includes(q)
      );
    }

    return { data: results, error: null };
  } catch (err) {
    return { data: [], error: err };
  }
}

/**
 * Fetch a single registry item by ID.
 */
export async function getContentRegistryEntryById(id) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('content_registry')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Check if a slug is available.
 */
export async function checkSlugAvailable(slug, excludeId = null) {
  if (!isSupabaseConfigured || !supabase || !slug) return true;

  try {
    let query = supabase
      .from('content_registry')
      .select('id')
      .eq('slug', slug.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) return true;
    return !data || data.length === 0;
  } catch (err) {
    return true;
  }
}

/**
 * Create a new registry entry.
 */
export async function createContentRegistryEntry(payload) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const cleanPayload = {
      title: payload.title.trim(),
      slug: payload.slug.trim().toLowerCase(),
      content_type: payload.content_type,
      status: payload.status || 'draft',
      visibility: payload.visibility || 'public',
      featured: Boolean(payload.featured),
      sort_order: Number(payload.sort_order) || 0,
      public_route: payload.public_route?.trim() || null,
      metadata: payload.metadata || {},
    };

    const { data, error } = await supabase
      .from('content_registry')
      .insert([cleanPayload])
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing registry entry.
 */
export async function updateContentRegistryEntry(id, payload) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const cleanPayload = { ...payload };
    if (cleanPayload.slug) {
      cleanPayload.slug = cleanPayload.slug.trim().toLowerCase();
    }
    if (cleanPayload.sort_order !== undefined) {
      cleanPayload.sort_order = Number(cleanPayload.sort_order) || 0;
    }

    const { data, error } = await supabase
      .from('content_registry')
      .update(cleanPayload)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Inspect dependencies for a registry entry before deletion.
 * Returns { hasDependencies, isPublished, isInNavigation, hasPages, warnings }
 */
export async function checkRegistryEntryDependencies(entry) {
  if (!entry) return { hasDependencies: false, warnings: [] };

  const warnings = [];
  const isPublished = entry.status === 'published' && entry.visibility === 'public';
  if (isPublished) {
    warnings.push(`This entry is currently PUBLISHED and publicly accessible at "${entry.public_route || entry.slug}". Deleting it will result in a 404 for visitors.`);
  }

  let isInNavigation = false;
  let hasPages = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const route = entry.public_route || `/${entry.content_type === 'case-study' ? 'work' : entry.content_type}/${entry.slug}`;
      const [navRes, pageRes] = await Promise.all([
        supabase.from('navigation_items').select('id, label, href').or(`href.eq.${route},href.eq./work/${entry.slug},href.eq./blog/${entry.slug}`),
        supabase.from('pages').select('id, title, slug').eq('slug', entry.slug),
      ]);

      if (navRes.data && navRes.data.length > 0) {
        isInNavigation = true;
        warnings.push(`Referenced in site navigation: "${navRes.data.map((n) => n.label).join(', ')}" (${navRes.data[0].href}). Deleting will leave broken navigation links.`);
      }

      if (pageRes.data && pageRes.data.length > 0) {
        hasPages = true;
        warnings.push(`Associated with site page record "${pageRes.data[0].title}" (${pageRes.data[0].slug}).`);
      }
    } catch (err) {
      console.warn('[contentRegistry] Error checking dependencies:', err);
    }
  }

  return {
    hasDependencies: warnings.length > 0,
    isPublished,
    isInNavigation,
    hasPages,
    warnings,
  };
}

const LOCAL_DELETED_KEY = 'cms_deleted_registry_ids';

/**
 * Returns set of locally deleted entry IDs (persists in localStorage)
 */
export function getDeletedRegistryIds() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_DELETED_KEY) : null;
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Records an entry ID as deleted in local storage
 */
export function recordLocalDeletedId(id) {
  if (!id) return;
  try {
    const set = getDeletedRegistryIds();
    set.add(String(id));
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify([...set]));
    }
  } catch {
    // Ignore localStorage quota errors
  }
}

/**
 * Delete a registry entry safely (supports Supabase persistence & local store fallback).
 */
export async function deleteContentRegistryEntry(id) {
  if (!id) {
    return { error: new Error('Entry ID is required for deletion.') };
  }

  // Always record locally deleted ID so deleted entries stay removed across renders
  recordLocalDeletedId(id);

  if (!isSupabaseConfigured || !supabase) {
    return {
      error: null,
      source: 'local_storage',
      message: 'Content item deleted locally.',
    };
  }

  try {
    const { error } = await supabase
      .from('content_registry')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[contentRegistry] Delete error:', error);
      return { error: new Error(error.message || 'Database error occurred during deletion.') };
    }

    return { error: null, source: 'supabase' };
  } catch (err) {
    console.error('[contentRegistry] Unexpected delete error:', err);
    return { error: err };
  }
}

/**
 * Convenience toggle: publish / unpublish
 */
export async function toggleRegistryPublish(id, currentStatus) {
  const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
  return updateContentRegistryEntry(id, { status: nextStatus });
}

/**
 * Convenience toggle: public / private
 */
export async function toggleRegistryVisibility(id, currentVisibility) {
  const nextVisibility = currentVisibility === 'public' ? 'private' : 'public';
  return updateContentRegistryEntry(id, { visibility: nextVisibility });
}

/**
 * Convenience toggle: featured
 */
export async function toggleRegistryFeatured(id, currentFeatured) {
  return updateContentRegistryEntry(id, { featured: !currentFeatured });
}

// ─── Public-facing named API ──────────────────────────────────────────────────
// These methods are used by public portfolio pages.
// They all enforce status = published + visibility = public via getContentRegistry.

/**
 * Return all published + public registry entries, sorted by sort_order.
 */
export async function getPublishedPublicContent() {
  return getContentRegistry();
}

/**
 * Return published + public registry entries filtered by content_type.
 */
export async function getPublishedPublicContentByType(type) {
  return getContentRegistry({ contentType: type });
}

/**
 * Return published + public registry entries where featured = true.
 */
export async function getFeaturedPublishedContent() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null, source: 'unconfigured' };
  }

  try {
    const { data, error } = await supabase
      .from('content_registry')
      .select('*')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .eq('featured', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('[contentRegistry] Error fetching featured content:', error);
      return { data: [], error };
    }
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[contentRegistry] Network error (featured):', err);
    return { data: [], error: err };
  }
}

/**
 * Lookup a single published + public registry entry by slug.
 * Returns { data: entry|null, error, notFound: boolean }.
 * draft / private / archived items are NOT returned — RLS enforces this.
 */
export async function getPublishedPublicContentBySlug(slug) {
  if (!slug) return { data: null, error: null, notFound: true };

  if (!isSupabaseConfigured || !supabase) {
    // Supabase not configured — skip registry gate, let existing routing handle it
    return { data: null, error: null, source: 'unconfigured', notFound: false };
  }

  try {
    const { data, error } = await supabase
      .from('content_registry')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .maybeSingle();

    if (error) {
      console.warn('[contentRegistry] Error fetching slug:', slug, error);
      // On error, do not block the user — return unconfigured-style
      return { data: null, error, notFound: false };
    }

    // data === null means the slug exists but is draft/private/archived (RLS hides it)
    // OR the slug simply does not exist yet in the Registry.
    // We cannot distinguish those two cases from the public API — and that's intentional.
    return { data: data || null, error: null, notFound: !data };
  } catch (err) {
    console.error('[contentRegistry] Network error (slug):', err);
    return { data: null, error: err, notFound: false };
  }
}

/**
 * Normalizes a content_registry entry into a unified presentation model.
 * Content Registry metadata is strictly authoritative for all content and catalog fields.
 * Presentation assets (heroImage, logoMark) are authoritatively resolved from Registry metadata,
 * falling back to registered bundled assets by slug, or legacy presentationAsset if provided.
 */
export function normalizeRegistryEntry(entry, presentationAsset = null) {
  if (!entry) return null;
  const meta = entry.metadata || {};
  const asset = presentationAsset || {};

  const badge = meta.badge || (entry.sort_order ? String(entry.sort_order).padStart(2, '0') : '');
  const kicker = meta.kicker || (entry.content_type ? entry.content_type.toUpperCase() : '');
  const description = meta.description || '';
  const subtitle = meta.subtitle || '';
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const category = meta.category || '';
  const year = meta.year || null;
  const route = entry.public_route || getContentTypeRoute(entry);

  // Authoritative Hero Image resolution
  const rawHero = meta.heroImage || meta.presentation?.heroImage || meta.image;
  const heroImage = rawHero
    ? resolveAsset(rawHero)
    : (resolveAsset(entry.slug) || asset.heroImage || null);

  // Authoritative Hero Alt
  const heroImageAlt =
    meta.heroImageAlt ||
    meta.presentation?.heroImageAlt ||
    asset.heroImageAlt ||
    `${entry.title} showcase`;

  // Authoritative Logo Mark resolution
  const rawLogo = meta.logoMark || meta.presentation?.logoMark;
  const logoMark =
    rawLogo ||
    asset.card?.logoMark ||
    asset.logoMark ||
    DEFAULT_LOGO_MARKS[entry.slug] ||
    null;

  const caseStudy = meta.caseStudy ? normalizeCaseStudyContent(meta.caseStudy, entry.slug) : null;
  const page = meta.page || null;
  const presentation = {
    badge,
    kicker,
    description,
    subtitle,
    tags,
    category,
    year,
    heroImage,
    heroImageAlt,
    logoMark,
  };

  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    public_route: route,
    route,
    featured: Boolean(entry.featured),
    sort_order: entry.sort_order ?? 0,
    content_type: entry.content_type,
    contentType: entry.content_type,
    presentation,
    caseStudy,
    page,
    badge,
    kicker,
    description,
    subtitle,
    tags,
    category,
    year,
    heroImage,
    heroImageAlt,
    logoMark,
    card: {
      badge,
      title: entry.title,
      kicker,
      description,
      subtitle,
      tags,
      logoMark,
    },
  };
}


