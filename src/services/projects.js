import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { projects as localProjects } from '../data/projects';

/**
 * Fetch all published projects (sorted by sort_order / order).
 * Falls back to local projects data if Supabase is unconfigured or unreachable.
 */
export async function getProjects() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localProjects, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('[projectsService] Supabase returned empty or error, falling back to local data:', error);
      return { data: localProjects, error: error || null, source: 'local_fallback' };
    }

    return { data, error: null, source: 'supabase' };
  } catch (err) {
    console.warn('[projectsService] Network/query failure, using local data fallback:', err);
    return { data: localProjects, error: err, source: 'local_fallback' };
  }
}

/**
 * Fetch all projects for admin (includes draft, published, archived).
 */
export async function getAdminProjects() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localProjects, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: localProjects, error, source: 'local_fallback' };
    }

    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: localProjects, error: err, source: 'local_fallback' };
  }
}

/**
 * Fetch a single project by slug or ID.
 */
export async function getProjectBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    const localMatch = localProjects.find((p) => p.slug === slug) || null;
    return { data: localMatch, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) {
      const localMatch = localProjects.find((p) => p.slug === slug) || null;
      return { data: localMatch, error: error || null, source: 'local_fallback' };
    }

    return { data, error: null, source: 'supabase' };
  } catch (err) {
    const localMatch = localProjects.find((p) => p.slug === slug) || null;
    return { data: localMatch, error: err, source: 'local_fallback' };
  }
}

/**
 * Fetch a single project by ID for Admin Editor.
 */
export async function getAdminProjectById(id) {
  if (!isSupabaseConfigured || !supabase) {
    const localMatch = localProjects.find((p) => p.id === id || p.slug === id) || null;
    return { data: localMatch, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      // Fallback search by slug or id
      const localMatch = localProjects.find((p) => p.id === id || p.slug === id) || null;
      return { data: localMatch, error: error || null, source: 'local_fallback' };
    }

    return { data, error: null, source: 'supabase' };
  } catch (err) {
    const localMatch = localProjects.find((p) => p.id === id || p.slug === id) || null;
    return { data: localMatch, error: err, source: 'local_fallback' };
  }
}

/**
 * Update project fields in Supabase.
 */
export async function updateProject(id, updates) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: null,
      error: new Error('Supabase is unconfigured. Changes cannot be persisted to database.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
