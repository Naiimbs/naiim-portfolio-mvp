import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { caseStudies as localCaseStudies } from '../data/caseStudies';

/**
 * Fetch case study details by project slug.
 * Resolves case_studies -> case_study_sections -> section_blocks hierarchy.
 * Seamlessly falls back to localCaseStudies if Supabase is unconfigured or returns nothing.
 */
export async function getCaseStudyBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    const localMatch = localCaseStudies[slug] || null;
    return { data: localMatch, error: null, source: 'local' };
  }

  try {
    // 1. Find project id and case study
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
