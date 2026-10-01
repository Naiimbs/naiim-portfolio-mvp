import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Service for Pages, Page Sections, Navigation Items, and Site Settings.
 * Supports Supabase persistence with safe local fallback.
 */

// Local fallback data for pages
const FALLBACK_PAGES = [
  {
    id: 'page-home',
    slug: 'home',
    title: 'Home',
    status: 'draft',
    template: 'default',
    seo_title: 'Naïm Bsili — Lead Product Designer & Design Systems Engineer',
    seo_description: 'Portfolio of Naïm Bsili, specializing in AI design systems, UX architecture, and digital products.',
    canonical_url: '/',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: null,
  },
  {
    id: 'page-work',
    slug: 'work',
    title: 'Work',
    status: 'draft',
    template: 'default',
    seo_title: 'Selected Work — Naïm Bsili',
    seo_description: 'Case studies & digital products directory.',
    canonical_url: '/work',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: null,
  },
  {
    id: 'page-about',
    slug: 'about',
    title: 'About',
    status: 'draft',
    template: 'default',
    seo_title: 'About — Naïm Bsili',
    seo_description: 'Career journey, experience and skills.',
    canonical_url: '/about',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: null,
  },
];

// Local fallback navigation items
const FALLBACK_NAVIGATION = [
  { id: 'nav-1', location: 'header', label: 'Work', href: '/work', item_type: 'link', parent_id: null, sort_order: 1, is_visible: true, open_in_new_tab: false },
  { id: 'nav-2', location: 'header', label: 'Agents', href: '/agents', item_type: 'link', parent_id: null, sort_order: 2, is_visible: true, open_in_new_tab: false },
  { id: 'nav-3', location: 'header', label: 'Plugins', href: '/plugins', item_type: 'link', parent_id: null, sort_order: 3, is_visible: true, open_in_new_tab: false },
  { id: 'nav-4', location: 'header', label: 'Blog', href: '/blog', item_type: 'link', parent_id: null, sort_order: 4, is_visible: true, open_in_new_tab: false },
  { id: 'nav-5', location: 'header', label: 'About', href: '/about', item_type: 'link', parent_id: null, sort_order: 5, is_visible: true, open_in_new_tab: false },
  { id: 'nav-6', location: 'footer', label: 'Privacy Policy', href: '/privacy', item_type: 'link', parent_id: null, sort_order: 1, is_visible: true, open_in_new_tab: false },
];

// In-memory admin store for local development when offline
let localPagesStore = [...FALLBACK_PAGES];
let localSectionsStore = [];
let localNavStore = [...FALLBACK_NAVIGATION];
let localSettingsStore = {};

/* ==============================================================================
   1. PAGES SERVICE
   ============================================================================== */

export async function getPublishedPages() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localPagesStore.filter((p) => p.status === 'published'), error: null, source: 'local' };
  }
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error, source: 'local_fallback' };
    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: [], error: err, source: 'local_fallback' };
  }
}

export async function getAdminPages() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localPagesStore, error: null, source: 'local' };
  }
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error, source: 'supabase_error' };
    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: [], error: err, source: 'error' };
  }
}

export async function getPageBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    const page = localPagesStore.find((p) => p.slug === slug && p.status === 'published');
    return { data: page || null, error: page ? null : new Error('Page not found'), source: 'local' };
  }
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      const fallback = localPagesStore.find((p) => p.slug === slug && p.status === 'published');
      return { data: fallback || null, error, source: 'local_fallback' };
    }
    return { data: data || null, error: null, source: 'supabase' };
  } catch (err) {
    const fallback = localPagesStore.find((p) => p.slug === slug && p.status === 'published');
    return { data: fallback || null, error: err, source: 'local_fallback' };
  }
}

export async function createPage(pageData) {
  if (!isSupabaseConfigured || !supabase) {
    const newPage = {
      id: `page-${Date.now()}`,
      slug: pageData.slug || `page-${Date.now()}`,
      title: pageData.title || 'Untitled Page',
      status: pageData.status || 'draft',
      template: pageData.template || 'default',
      seo_title: pageData.seo_title || null,
      seo_description: pageData.seo_description || null,
      canonical_url: pageData.canonical_url || null,
      og_image_id: pageData.og_image_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: pageData.status === 'published' ? new Date().toISOString() : null,
    };
    localPagesStore.unshift(newPage);
    return { data: newPage, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('pages')
      .insert([pageData])
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updatePage(id, updates) {
  const updatedPayload = { ...updates, updated_at: new Date().toISOString() };
  if (!isSupabaseConfigured || !supabase) {
    const idx = localPagesStore.findIndex((p) => p.id === id);
    if (idx !== -1) {
      localPagesStore[idx] = { ...localPagesStore[idx], ...updatedPayload };
      return { data: localPagesStore[idx], error: null };
    }
    return { data: null, error: new Error('Page not found') };
  }
  try {
    const { data, error } = await supabase
      .from('pages')
      .update(updatedPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deletePage(id) {
  if (!isSupabaseConfigured || !supabase) {
    localPagesStore = localPagesStore.filter((p) => p.id !== id);
    localSectionsStore = localSectionsStore.filter((s) => s.page_id !== id);
    return { error: null };
  }
  try {
    const { error } = await supabase.from('pages').delete().eq('id', id);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

/* ==============================================================================
   2. PAGE SECTIONS SERVICE
   ============================================================================== */

export async function getPageSections(pageId) {
  if (!isSupabaseConfigured || !supabase) {
    const sections = localSectionsStore
      .filter((s) => s.page_id === pageId && s.is_visible)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return { data: sections, error: null, source: 'local' };
  }
  try {
    const { data, error } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', pageId)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) return { data: [], error, source: 'local_fallback' };
    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: [], error: err, source: 'local_fallback' };
  }
}

export async function getAdminPageSections(pageId) {
  if (!isSupabaseConfigured || !supabase) {
    const sections = localSectionsStore
      .filter((s) => s.page_id === pageId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return { data: sections, error: null, source: 'local' };
  }
  try {
    const { data, error } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: true });

    if (error) return { data: [], error, source: 'local_fallback' };
    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: [], error: err, source: 'local_fallback' };
  }
}

export async function createPageSection(sectionData) {
  if (!isSupabaseConfigured || !supabase) {
    const newSec = {
      id: `sec-${Date.now()}`,
      page_id: sectionData.page_id,
      section_type: sectionData.section_type || 'text',
      label: sectionData.label || 'New Section',
      sort_order: sectionData.sort_order || 0,
      is_visible: sectionData.is_visible !== undefined ? sectionData.is_visible : true,
      config: sectionData.config || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localSectionsStore.push(newSec);
    return { data: newSec, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('page_sections')
      .insert([sectionData])
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updatePageSection(id, updates) {
  const payload = { ...updates, updated_at: new Date().toISOString() };
  if (!isSupabaseConfigured || !supabase) {
    const idx = localSectionsStore.findIndex((s) => s.id === id);
    if (idx !== -1) {
      localSectionsStore[idx] = { ...localSectionsStore[idx], ...payload };
      return { data: localSectionsStore[idx], error: null };
    }
    return { data: null, error: new Error('Section not found') };
  }
  try {
    const { data, error } = await supabase
      .from('page_sections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deletePageSection(id) {
  if (!isSupabaseConfigured || !supabase) {
    localSectionsStore = localSectionsStore.filter((s) => s.id !== id);
    return { error: null };
  }
  try {
    const { error } = await supabase.from('page_sections').delete().eq('id', id);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

/* ==============================================================================
   3. NAVIGATION SERVICE
   ============================================================================== */

export async function getNavigationItems(location = 'header') {
  if (!isSupabaseConfigured || !supabase) {
    const items = localNavStore
      .filter((n) => n.location === location && n.is_visible)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return { data: items, error: null, source: 'local' };
  }
  try {
    const { data, error } = await supabase
      .from('navigation_items')
      .select('*')
      .eq('location', location)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) return { data: FALLBACK_NAVIGATION.filter((n) => n.location === location), error, source: 'local_fallback' };
    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: FALLBACK_NAVIGATION.filter((n) => n.location === location), error: err, source: 'local_fallback' };
  }
}

export async function getHeaderNavigation() {
  return getNavigationItems('header');
}

export async function getFooterNavigation() {
  return getNavigationItems('footer');
}

export async function getAdminNavigationItems() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localNavStore, error: null, source: 'local' };
  }
  try {
    const { data, error } = await supabase
      .from('navigation_items')
      .select('*')
      .order('location', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) return { data: localNavStore, error, source: 'local_fallback' };
    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: localNavStore, error: err, source: 'local_fallback' };
  }
}

export async function createNavigationItem(itemData) {
  if (!isSupabaseConfigured || !supabase) {
    const newItem = {
      id: `nav-${Date.now()}`,
      location: itemData.location || 'header',
      label: itemData.label || 'Link',
      href: itemData.href || '#',
      item_type: itemData.item_type || 'link',
      parent_id: itemData.parent_id || null,
      sort_order: itemData.sort_order || 0,
      is_visible: itemData.is_visible !== undefined ? itemData.is_visible : true,
      open_in_new_tab: itemData.open_in_new_tab || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localNavStore.push(newItem);
    return { data: newItem, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('navigation_items')
      .insert([itemData])
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateNavigationItem(id, updates) {
  const payload = { ...updates, updated_at: new Date().toISOString() };
  if (!isSupabaseConfigured || !supabase) {
    const idx = localNavStore.findIndex((n) => n.id === id);
    if (idx !== -1) {
      localNavStore[idx] = { ...localNavStore[idx], ...payload };
      return { data: localNavStore[idx], error: null };
    }
    return { data: null, error: new Error('Navigation item not found') };
  }
  try {
    const { data, error } = await supabase
      .from('navigation_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteNavigationItem(id) {
  if (!isSupabaseConfigured || !supabase) {
    localNavStore = localNavStore.filter((n) => n.id !== id);
    return { error: null };
  }
  try {
    const { error } = await supabase.from('navigation_items').delete().eq('id', id);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

/* ==============================================================================
   4. SITE SETTINGS SERVICE
   ============================================================================== */

export const DEFAULT_SITE_SETTINGS = {
  site_name: 'Naïm Bsili',
  tagline: 'Senior UX/UI Designer · AI Product Builder',
  logo_url: '',
  contact_email: 'hi@naiimbsili.com',
  contact_cta_label: "Let's Talk",
  contact_cta_href: '#contact',
  linkedin: 'https://tn.linkedin.com/in/bsili-naiim',
  github: 'https://github.com/naiimbsili',
  instagram: 'https://www.instagram.com/designer.tunisien/',
  behance: '',
  dribbble: '',
  footer_text: 'Building intelligent digital products & AI systems.',
  copyright_text: '© 2026 Naïm Bsili. All rights reserved.',
  default_seo_title: 'Naïm Bsili — Product Designer & AI Builder',
  default_seo_description: 'Naïm Bsili — Product Designer & AI Builder. UX/UI, Product Design, AI, Low-Code and Product Operations.',
  default_og_image: '/assets/images/naim-portrait.jpg',
};

const parseSettingValue = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if (val.value !== undefined) return val.value;
    if (val.val !== undefined) return val.val;
  }
  return val;
};

export async function getPublicSiteSettings() {
  const fallback = { ...DEFAULT_SITE_SETTINGS, ...localSettingsStore };
  if (!isSupabaseConfigured || !supabase) {
    return { data: fallback, error: null, source: 'local' };
  }
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('is_public', true);
    if (error) return { data: fallback, error, source: 'local_fallback' };
    const map = { ...DEFAULT_SITE_SETTINGS };
    (data || []).forEach((row) => {
      map[row.key] = parseSettingValue(row.value);
    });
    return { data: map, error: null, source: 'supabase' };
  } catch (err) {
    return { data: fallback, error: err, source: 'local_fallback' };
  }
}

export async function getAdminSiteSettings() {
  const fallback = { ...DEFAULT_SITE_SETTINGS, ...localSettingsStore };
  if (!isSupabaseConfigured || !supabase) {
    return { data: fallback, error: null, source: 'local' };
  }
  try {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) return { data: fallback, error, source: 'local_fallback' };
    const map = { ...DEFAULT_SITE_SETTINGS };
    (data || []).forEach((row) => {
      map[row.key] = parseSettingValue(row.value);
    });
    return { data: map, error: null, source: 'supabase' };
  } catch (err) {
    return { data: fallback, error: err, source: 'local_fallback' };
  }
}

export async function updateSiteSetting(key, value, isPublic = true) {
  if (!isSupabaseConfigured || !supabase) {
    localSettingsStore[key] = value;
    return { data: { key, value }, error: null };
  }
  try {
    const jsonValue = typeof value === 'string' ? value : value;
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key, value: jsonValue, is_public: isPublic, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateMultipleSiteSettings(settingsObj, isPublic = true) {
  const keys = Object.keys(settingsObj);
  for (const key of keys) {
    const val = settingsObj[key];
    const res = await updateSiteSetting(key, val, isPublic);
    if (res.error) return { error: res.error };
  }
  return { error: null };
}
