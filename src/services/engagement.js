import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Reader engagement for blog articles: view counts and star feedback.
 * All functions degrade gracefully when Supabase is unconfigured.
 */

// Increment the view counter once per browser session, returning the latest count.
export async function recordPostView(slug) {
  if (!slug || !isSupabaseConfigured || !supabase) return { data: null, error: null };
  const key = `post_viewed_${slug}`;
  let already = false;
  try {
    already = sessionStorage.getItem(key) === '1';
  } catch {
    already = false;
  }

  try {
    if (already) {
      const { data } = await supabase.from('post_views').select('views').eq('slug', slug).maybeSingle();
      return { data: data?.views ?? 0, error: null };
    }
    const { data, error } = await supabase.rpc('increment_post_view', { p_slug: slug });
    if (!error) {
      try { sessionStorage.setItem(key, '1'); } catch { /* noop */ }
    }
    return { data: typeof data === 'number' ? data : 0, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getPostRatingSummary(slug) {
  if (!slug || !isSupabaseConfigured || !supabase) return { data: { avg: 0, count: 0 }, error: null };
  try {
    const { data, error } = await supabase.rpc('get_post_rating_summary', { p_slug: slug });
    const row = Array.isArray(data) ? data[0] : data;
    return {
      data: { avg: Number(row?.avg_rating) || 0, count: Number(row?.rating_count) || 0 },
      error,
    };
  } catch (err) {
    return { data: { avg: 0, count: 0 }, error: err };
  }
}

// ---- Admin reads (require an authenticated admin session via RLS) ----

export async function getAllFeedback(limit = 500) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('post_feedback')
      .select('id, slug, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: data || [], error };
  } catch (err) {
    return { data: [], error: err };
  }
}

export async function getBlogTitles() {
  if (!isSupabaseConfigured || !supabase) return {};
  try {
    const { data } = await supabase
      .from('content_registry')
      .select('slug, title')
      .eq('content_type', 'blog');
    const map = {};
    (data || []).forEach((r) => { map[r.slug] = r.title; });
    return map;
  } catch {
    return {};
  }
}

export async function getAllViews() {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('post_views')
      .select('slug, views, updated_at')
      .order('views', { ascending: false });
    return { data: data || [], error };
  } catch (err) {
    return { data: [], error: err };
  }
}

export async function submitPostRating(slug, rating, comment = '') {
  if (!slug || !isSupabaseConfigured || !supabase) {
    return { data: null, error: { message: 'Feedback is unavailable right now.' } };
  }
  const value = Math.round(Number(rating));
  if (!(value >= 1 && value <= 5)) {
    return { data: null, error: { message: 'Please choose a rating between 1 and 5 stars.' } };
  }
  try {
    const { data, error } = await supabase
      .from('post_feedback')
      .insert([{ slug, rating: value, comment: (comment || '').slice(0, 2000) || null }]);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
