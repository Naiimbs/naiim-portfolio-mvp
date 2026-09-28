import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { caseStudies as localCaseStudies } from '../data/caseStudies';

/**
 * Fetch case study details by project slug.
 */
export async function getCaseStudyBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    const localMatch = localCaseStudies[slug] || null;
    return { data: localMatch, error: null, source: 'local' };
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, slug, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (projectError || !project) {
      const localMatch = localCaseStudies[slug] || null;
      return { data: localMatch, error: projectError || null, source: 'local_fallback' };
    }

    const { data: caseStudy, error: csError } = await supabase
      .from('case_studies')
      .select(`
        *,
        sections:case_study_sections(
          *,
          blocks:section_blocks(*)
        )
      `)
      .eq('project_id', project.id)
      .eq('status', 'published')
      .maybeSingle();

    if (csError || !caseStudy) {
      const localMatch = localCaseStudies[slug] || null;
      return { data: localMatch, error: csError || null, source: 'local_fallback' };
    }

    return { data: caseStudy, error: null, source: 'supabase' };
  } catch (err) {
    const localMatch = localCaseStudies[slug] || null;
    return { data: localMatch, error: err, source: 'local_fallback' };
  }
}

/**
 * Fetch all case studies for Admin CMS.
 */
export async function getAdminCaseStudies() {
  if (!isSupabaseConfigured || !supabase) {
    // Transform localCaseStudies into array list
    const localList = Object.entries(localCaseStudies).map(([slug, study]) => ({
      id: slug,
      slug,
      title: study.title || study.hero?.title || slug,
      type: study.type || 'standard',
      status: 'published',
      updated_at: '2026-09-28',
    }));
    return { data: localList, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error, source: 'supabase_error' };
    }

    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: [], error: err, source: 'error' };
  }
}
