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
 * Fetch a single project by slug.
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
