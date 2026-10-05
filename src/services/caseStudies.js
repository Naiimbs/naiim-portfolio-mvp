/**
 * services/caseStudies.js
 *
 * LEGACY / ADMIN ONLY SERVICE
 *
 * Public runtime case studies now read authoritatively from
 * Supabase Content Registry (metadata.caseStudy).
 * This service is retained for Admin CMS compatibility only.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { caseStudies as localCaseStudies } from '../data/caseStudies';

/**
 * Maps static fallback case study data into structured sections & blocks for the Visual CMS Editor.
 */
export function mapLocalCaseStudyToCMS(slug, study) {
  if (!study) return null;

  if (study.type === 'custom') {
    return {
      id: slug,
      project_id: slug,
      slug: slug,
      title: study.title || slug.toUpperCase(),
      subtitle: study.subtitle || '',
      type: 'custom',
      status: 'published',
      seo_title: `${study.title || slug.toUpperCase()} — Case Study · Naïm Bsili`,
      seo_description: study.subtitle || 'Product design and digital experience case study.',
      canonical_path: `/work/${slug}`,
      updated_at: '2026-09-28',
      sections: [],
    };
  }

  const sections = [];
  let order = 1;

  // 1. Hero Section
  if (study.hero) {
    sections.push({
      id: `sec-${slug}-hero`,
      section_type: 'hero',
      title: study.hero.title || study.title || slug,
      eyebrow: study.hero.eyebrow || 'CASE STUDY',
      order_index: order++,
      is_visible: true,
      blocks: [
        {
          id: `blk-${slug}-hero-text`,
          block_type: 'text',
          content: {
            heading: study.hero.title || '',
            body: study.hero.lead || '',
            metaChips: study.hero.metaChips || [],
          },
          order_index: 1,
          is_visible: true,
        },
        ...(study.hero.image
          ? [
              {
                id: `blk-${slug}-hero-img`,
                block_type: 'image',
                content: {
                  media_url: study.hero.image,
                  alt: study.hero.imageAlt || '',
                  caption: study.hero.caption || '',
                },
                order_index: 2,
                is_visible: true,
              },
            ]
          : []),
      ],
    });
  }

  // 2. Challenge / Problem Section
  if (study.challenge) {
    sections.push({
      id: `sec-${slug}-challenge`,
      section_type: 'challenge',
      title: study.challenge.title || 'The Challenge',
      eyebrow: study.challenge.eyebrow || 'THE CHALLENGE',
      order_index: order++,
      is_visible: true,
      blocks: [
        {
          id: `blk-${slug}-challenge-text`,
          block_type: 'text',
          content: {
            heading: study.challenge.title || '',
            body: study.challenge.copy || '',
            role: study.challenge.role || '',
            context: study.challenge.context || '',
          },
          order_index: 1,
          is_visible: true,
        },
      ],
    });
  }

  // 3. Contribution / Process Section
  if (study.contribution) {
    const blocks = [];
    let bOrder = 1;
    if (study.contribution.items && study.contribution.items.length > 0) {
      blocks.push({
        id: `blk-${slug}-contrib-items`,
        block_type: 'text',
        content: {
          heading: 'Key Contributions',
          body: study.contribution.items.join('\n• '),
        },
        order_index: bOrder++,
        is_visible: true,
      });
    }
    if (study.contribution.process && study.contribution.process.length > 0) {
      blocks.push({
        id: `blk-${slug}-contrib-process`,
        block_type: 'process',
        content: {
          steps: study.contribution.process.map((p) => ({
            number: p.step || '',
            title: p.title || '',
            description: p.desc || '',
          })),
        },
        order_index: bOrder++,
        is_visible: true,
      });
    }

    sections.push({
      id: `sec-${slug}-contrib`,
      section_type: 'process',
      title: study.contribution.title || 'My Contribution',
      eyebrow: study.contribution.eyebrow || 'MY CONTRIBUTION',
      order_index: order++,
      is_visible: true,
      blocks,
    });
  }

  // 4. Evidence / Gallery Section
  if (study.evidence) {
    sections.push({
      id: `sec-${slug}-evidence`,
      section_type: 'gallery',
      title: study.evidence.title || 'Project Evidence',
      eyebrow: study.evidence.eyebrow || 'DESIGN → CODE',
      order_index: order++,
      is_visible: true,
      blocks: [
        {
          id: `blk-${slug}-evidence-img`,
          block_type: 'image',
          content: {
            media_url: study.evidence.image || '',
            alt: study.evidence.imageAlt || '',
            caption: study.evidence.caption || '',
          },
          order_index: 1,
          is_visible: true,
        },
      ],
    });
  }

  // 5. Technology Section
  if (study.technology) {
    sections.push({
      id: `sec-${slug}-tech`,
      section_type: 'technology',
      title: study.technology.title || 'Technology',
      eyebrow: study.technology.eyebrow || 'TECHNOLOGY',
      order_index: order++,
      is_visible: true,
      blocks: [
        {
          id: `blk-${slug}-tech-items`,
          block_type: 'tech_stack',
          content: {
            items: (study.technology.tags || []).map((t) => ({
              name: t,
              category: 'Core Tooling',
            })),
          },
          order_index: 1,
          is_visible: true,
        },
      ],
    });
  }

  return {
    id: slug,
    project_id: slug,
    slug: slug,
    title: study.hero?.title || study.title || slug,
    subtitle: study.hero?.lead || study.subtitle || '',
    type: 'standard',
    status: 'published',
    seo_title: `${study.hero?.title || slug} — Case Study · Naïm Bsili`,
    seo_description: study.hero?.lead || study.subtitle || '',
    canonical_path: `/work/${slug}`,
    updated_at: '2026-09-28',
    sections,
  };
}

/**
 * Fetch case study details by project slug for the public renderer.
 * Strictly queries published content and visible sections/blocks.
 */
export async function getPublishedCaseStudyBySlug(slug) {
  if (!slug) return { data: null, isCMS: false };

  if (!isSupabaseConfigured || !supabase) {
    const localMatch = localCaseStudies[slug] || null;
    return { data: localMatch, isCMS: false, source: 'local' };
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (projectError || !project) {
      const localMatch = localCaseStudies[slug] || null;
      return { data: localMatch, isCMS: false, source: 'local_fallback' };
    }

    const { data: caseStudy, error: csError } = await supabase
      .from('case_studies')
      .select(`
        *,
        hero_media:media(*),
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
      return { data: localMatch, isCMS: false, source: 'local_fallback' };
    }

    // Attach project and sort visible sections & visible blocks
    const formatted = {
      ...caseStudy,
      slug: project.slug,
      project,
    };

    if (formatted.sections) {
      formatted.sections = formatted.sections
        .filter((s) => s.is_visible !== false)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      formatted.sections.forEach((s) => {
        if (s.blocks) {
          s.blocks = s.blocks
            .filter((b) => b.is_visible !== false)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }
      });
    }

    // If CMS case study has no sections in DB yet, fall back to local data
    if (!formatted.sections || formatted.sections.length === 0) {
      const localMatch = localCaseStudies[slug] || null;
      if (localMatch) {
        return { data: localMatch, isCMS: false, source: 'local_fallback' };
      }
    }

    return { data: formatted, isCMS: true, source: 'supabase' };
  } catch (err) {
    const localMatch = localCaseStudies[slug] || null;
    return { data: localMatch, isCMS: false, source: 'local_fallback' };
  }
}

export async function getCaseStudyBySlug(slug) {
  return getPublishedCaseStudyBySlug(slug);
}

/**
 * Fetch all case studies for Admin CMS.
 */
export async function getAdminCaseStudies() {
  if (!isSupabaseConfigured || !supabase) {
    const localList = Object.entries(localCaseStudies).map(([slug, study]) => {
      const mapped = mapLocalCaseStudyToCMS(slug, study);
      return {
        id: slug,
        slug,
        title: mapped.title,
        subtitle: mapped.subtitle,
        type: mapped.type,
        status: mapped.status,
        sectionsCount: mapped.sections.length,
        updated_at: '2026-09-28',
      };
    });
    return { data: localList, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select(`
        *,
        project:projects(id, title, slug),
        sections:case_study_sections(id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error, source: 'supabase_error' };
    }

    const formatted = (data || []).map((cs) => ({
      ...cs,
      slug: cs.project?.slug || cs.id,
      sectionsCount: cs.sections ? cs.sections.length : 0,
    }));

    return { data: formatted, error: null, source: 'supabase' };
  } catch (err) {
    return { data: [], error: err, source: 'error' };
  }
}

/**
 * Fetch a single case study by ID or Slug for the Admin Visual Editor.
 */
export async function getAdminCaseStudyById(idOrSlug) {
  if (!isSupabaseConfigured || !supabase) {
    const localMatch = localCaseStudies[idOrSlug] || null;
    if (localMatch) {
      const mapped = mapLocalCaseStudyToCMS(idOrSlug, localMatch);
      return { data: mapped, error: null, source: 'local' };
    }
    return { data: null, error: { message: 'Case study not found in snapshot data.' }, source: 'local' };
  }

  try {
    // Attempt query by case_study id or project slug
    let query = supabase
      .from('case_studies')
      .select(`
        *,
        project:projects(id, title, slug),
        sections:case_study_sections(
          *,
          blocks:section_blocks(*)
        )
      `);

    // UUID regex check
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      // Find project first
      const { data: proj } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', idOrSlug)
        .maybeSingle();

      if (proj) {
        query = query.eq('project_id', proj.id);
      } else {
        query = query.eq('id', idOrSlug);
      }
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      const localMatch = localCaseStudies[idOrSlug] || null;
      if (localMatch) {
        return { data: mapLocalCaseStudyToCMS(idOrSlug, localMatch), error: null, source: 'local_fallback' };
      }
      return { data: null, error: error || { message: 'Case study not found.' }, source: 'supabase' };
    }

    // Sort sections and blocks ascending
    if (data.sections) {
      data.sections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      data.sections.forEach((s) => {
        if (s.blocks) {
          s.blocks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }
      });
    }

    return { data, error: null, source: 'supabase' };
  } catch (err) {
    const localMatch = localCaseStudies[idOrSlug] || null;
    if (localMatch) {
      return { data: mapLocalCaseStudyToCMS(idOrSlug, localMatch), error: null, source: 'local_fallback' };
    }
    return { data: null, error: err, source: 'error' };
  }
}

/**
 * Update case study top-level settings (metadata, SEO, status).
 */
export async function updateCaseStudy(id, payload) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { id, ...payload }, error: null, source: 'local_simulated' };
  }

  try {
    const { data, error } = await supabase
      .from('case_studies')
      .update({
        title: payload.title,
        subtitle: payload.subtitle,
        seo_title: payload.seo_title,
        seo_description: payload.seo_description,
        canonical_path: payload.canonical_path,
        status: payload.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error, source: error ? 'supabase_error' : 'supabase' };
  } catch (err) {
    return { data: null, error: err, source: 'error' };
  }
}

/**
 * Save full case study graph (settings + sections + blocks) sequentially.
 */
export async function saveFullCaseStudy(caseStudyId, fullData) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: fullData, error: null, source: 'local_simulated' };
  }

  try {
    // 1. Update case study settings
    const { error: csErr } = await supabase
      .from('case_studies')
      .update({
        title: fullData.title,
        subtitle: fullData.subtitle,
        seo_title: fullData.seo_title,
        seo_description: fullData.seo_description,
        canonical_path: fullData.canonical_path,
        status: fullData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseStudyId);

    if (csErr) throw csErr;

    // 2. Persist sections & blocks if not custom
    if (fullData.type !== 'custom' && Array.isArray(fullData.sections)) {
      for (let i = 0; i < fullData.sections.length; i++) {
        const sec = fullData.sections[i];
        const secPayload = {
          case_study_id: caseStudyId,
          section_type: sec.section_type || 'content',
          title: sec.title || '',
          eyebrow: sec.eyebrow || '',
          order_index: i + 1,
          is_visible: sec.is_visible !== false,
          updated_at: new Date().toISOString(),
        };

        const isSecUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sec.id);
        let currentSecId = sec.id;

        if (isSecUUID) {
          const { error: secErr } = await supabase
            .from('case_study_sections')
            .upsert({ id: sec.id, ...secPayload });
          if (secErr) throw secErr;
        } else {
          const { data: newSec, error: newSecErr } = await supabase
            .from('case_study_sections')
            .insert(secPayload)
            .select('id')
            .single();
          if (newSecErr) throw newSecErr;
          currentSecId = newSec.id;
        }

        // Save blocks for this section
        if (Array.isArray(sec.blocks)) {
          for (let bIdx = 0; bIdx < sec.blocks.length; bIdx++) {
            const blk = sec.blocks[bIdx];
            const blkPayload = {
              section_id: currentSecId,
              block_type: blk.block_type || 'text',
              content: blk.content || {},
              order_index: bIdx + 1,
              is_visible: blk.is_visible !== false,
              updated_at: new Date().toISOString(),
            };

            const isBlkUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blk.id);
            if (isBlkUUID) {
              await supabase.from('section_blocks').upsert({ id: blk.id, ...blkPayload });
            } else {
              await supabase.from('section_blocks').insert(blkPayload);
            }
          }
        }
      }
    }

    return { data: fullData, error: null, source: 'supabase' };
  } catch (err) {
    return { data: null, error: err, source: 'error' };
  }
}
