import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Fetch media records for Admin Media Library.
 */
export async function getAdminMedia() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null, source: 'local_empty' };
  }

  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error, source: 'supabase_error' };
    }

    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: [], error: err, source: 'error' };
  }
}
