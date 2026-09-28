import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Fetch all media assets for Admin Media Library.
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

/**
 * Fetch a single media record by ID.
 */
export async function getMediaById(id) {
  if (!isSupabaseConfigured || !supabase || !id) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetch multiple media records by an array of IDs.
 */
export async function getMediaByIds(ids = []) {
  if (!isSupabaseConfigured || !supabase || !Array.isArray(ids) || ids.length === 0) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .in('id', ids);

    return { data: data || [], error };
  } catch (err) {
    return { data: [], error: err };
  }
}

/**
 * Upload a media file to Supabase Storage and register metadata in public.media.
 */
export async function uploadMedia(file, metadata = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: null,
      error: { message: 'Supabase storage is not configured in .env variables.' },
    };
  }

  // 1. Validation: MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      data: null,
      error: {
        message: `Unsupported file type: ${file.type}. Allowed formats: JPG, PNG, WebP, SVG, GIF.`,
      },
    };
  }

  // 2. Validation: File size
  if (file.size > MAX_FILE_SIZE) {
    return {
      data: null,
      error: {
        message: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`,
      },
    };
  }

  try {
    // 3. Generate predictable collision-safe path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = metadata.folder || 'case-studies';
    const filePath = `${folder}/${Date.now()}_${sanitizedName}`;

    // 4. Upload to Supabase Storage bucket 'portfolio-media'
    const { error: uploadError } = await supabase.storage
      .from('portfolio-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // 5. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl || '';

    // 6. Extract dimensions if image
    let width = null;
    let height = null;
    if (typeof window !== 'undefined' && file.type.startsWith('image/')) {
      try {
        const dimensions = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve({ width: null, height: null });
          img.src = URL.createObjectURL(file);
        });
        width = dimensions.width;
        height = dimensions.height;
      } catch {
        // Continue if dimension parsing fails
      }
    }

    // 7. Insert DB record into public.media
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media')
      .insert({
        storage_path: filePath,
        public_url: publicUrl,
        filename: file.name,
        alt_text: metadata.alt_text || file.name,
        caption: metadata.caption || '',
        mime_type: file.type,
        width,
        height,
        size_bytes: file.size,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback storage upload on DB failure
      await supabase.storage.from('portfolio-media').remove([filePath]);
      return { data: null, error: dbError };
    }

    return { data: mediaRecord, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Update media metadata (alt_text, caption).
 */
export async function updateMedia(id, { alt_text, caption }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { id, alt_text, caption }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('media')
      .update({
        alt_text,
        caption,
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Delete a media asset from Supabase DB and Storage.
 */
export async function deleteMedia(id, storagePath) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { id }, error: null };
  }

  try {
    // 1. Check if media is referenced in projects or case studies
    const [projCheck, csCheck] = await Promise.all([
      supabase.from('projects').select('id, title').eq('thumbnail_media_id', id).maybeSingle(),
      supabase.from('case_studies').select('id, title').eq('hero_media_id', id).maybeSingle(),
    ]);

    if (projCheck.data) {
      return {
        data: null,
        error: { message: `Media is currently in use by project "${projCheck.data.title}". Remove reference first.` },
      };
    }

    if (csCheck.data) {
      return {
        data: null,
        error: { message: `Media is currently in use as hero for case study "${csCheck.data.title}". Remove reference first.` },
      };
    }

    // 2. Delete database record
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    // 3. Delete from Storage if path provided
    if (storagePath) {
      await supabase.storage.from('portfolio-media').remove([storagePath]);
    }

    return { data: { id }, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
