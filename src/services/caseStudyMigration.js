import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { caseStudies as localCaseStudies } from '../data/caseStudies';

/**
 * Standard Case Studies targeted for migration.
 * WINNI and Assestini are strictly excluded as custom React case studies.
 */
export const STANDARD_CASE_STUDY_SLUGS = [
  'cha9a9a',
  'naim-copilot',
  'career-os',
  'saudi-government',
  'saudi-banking',
  'saudi-regulatory',
  'dga',
];

/**
 * Transforms a standard case study from local data format into CMS tables schema.
 */
export function buildCaseStudyMigrationPayload(slug, localData) {
  if (!localData || localData.type === 'custom') return null;

  const { hero, challenge, contribution, evidence, technology } = localData;

  const caseStudyRecord = {
    type: 'standard',
    title: hero?.title || localData.title || slug,
    subtitle: hero?.lead || localData.subtitle || '',
    seo_title: `${hero?.title || slug} — Case Study`,
    seo_description: hero?.lead || localData.subtitle || '',
    canonical_path: `/work/${slug}`,
    status: 'published',
  };

  const sections = [];
  let secOrder = 1;

  // 1. Hero Section
  if (hero) {
    sections.push({
      section_type: 'hero',
      title: hero.title || slug,
      eyebrow: hero.eyebrow || 'CASE STUDY',
      order_index: secOrder++,
      is_visible: true,
      blocks: [
        {
          block_type: 'hero_content',
          content: {
            lead: hero.lead || '',
            metaChips: hero.metaChips || [],
          },
          order_index: 1,
          is_visible: true,
        },
        ...(hero.image
          ? [
              {
                block_type: 'image',
                content: {
                  media_url: hero.image,
                  alt: hero.imageAlt || hero.title || '',
                  caption: hero.caption || '',
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
  if (challenge) {
    sections.push({
      section_type: 'challenge',
      title: challenge.title || 'The Challenge',
      eyebrow: challenge.eyebrow || 'THE CHALLENGE',
      order_index: secOrder++,
      is_visible: true,
      blocks: [
        {
          block_type: 'challenge_content',
          content: {
            copy: challenge.copy || '',
            role: challenge.role || '',
            context: challenge.context || '',
          },
          order_index: 1,
          is_visible: true,
        },
      ],
    });
  }

  // 3. Contribution / Process Section
  if (contribution) {
    const blocks = [];
    let blkOrder = 1;

    if (contribution.items && contribution.items.length > 0) {
      blocks.push({
        block_type: 'contribution_content',
        content: {
          items: contribution.items,
        },
        order_index: blkOrder++,
        is_visible: true,
      });
    }

    if (contribution.process && contribution.process.length > 0) {
      blocks.push({
        block_type: 'process',
        content: {
          steps: contribution.process.map((p) => ({
            number: p.step || '',
            title: p.title || '',
            description: p.desc || '',
          })),
        },
        order_index: blkOrder++,
        is_visible: true,
      });
    }

    sections.push({
      section_type: 'contribution',
      title: contribution.title || 'My Contribution',
      eyebrow: contribution.eyebrow || 'MY CONTRIBUTION',
      order_index: secOrder++,
      is_visible: true,
      blocks,
    });
  }

  // 4. Selected Evidence / Gallery Section
  if (evidence) {
    sections.push({
      section_type: 'evidence',
      title: evidence.title || 'Project Evidence',
      eyebrow: evidence.eyebrow || 'SELECTED EVIDENCE',
      order_index: secOrder++,
      is_visible: true,
      blocks: [
        {
          block_type: 'image',
          content: {
            media_url: evidence.image || '',
            alt: evidence.imageAlt || evidence.title || '',
            caption: evidence.caption || '',
          },
          order_index: 1,
          is_visible: true,
        },
      ],
    });
  }

  // 5. Technology Section
  if (technology) {
    sections.push({
      section_type: 'technology',
      title: technology.title || 'Technology',
      eyebrow: technology.eyebrow || 'TECHNOLOGY',
      order_index: secOrder++,
      is_visible: true,
      blocks: [
        {
          block_type: 'technology_tags',
          content: {
            tags: technology.tags || [],
          },
          order_index: 1,
          is_visible: true,
        },
      ],
    });
  }

  return {
    caseStudyRecord,
    sections,
  };
}

/**
 * Explicit migration execution function.
 * Migrates a single standard case study by slug into Supabase.
 */
export async function migrateStandardCaseStudy(slug) {
  if (!STANDARD_CASE_STUDY_SLUGS.includes(slug)) {
    return {
      success: false,
      error: `Slug "${slug}" is not an authorized standard case study for migration.`,
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: 'Supabase client is not configured.',
    };
  }

  const localData = localCaseStudies[slug];
  if (!localData) {
    return {
      success: false,
      error: `Local data for slug "${slug}" not found in src/data/caseStudies.js`,
    };
  }

  const payload = buildCaseStudyMigrationPayload(slug, localData);
  if (!payload) {
    return {
      success: false,
      error: `Failed to construct migration payload for "${slug}".`,
    };
  }

  try {
    // 1. Locate project
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, title, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (projErr || !project) {
      return {
        success: false,
        error: `Project record for slug "${slug}" not found in database: ${projErr?.message}`,
      };
    }

    // 2. Find or create case study record
    let caseStudyId = null;
    const { data: existingCS, error: csFindErr } = await supabase
      .from('case_studies')
      .select('id')
      .eq('project_id', project.id)
      .maybeSingle();

    if (existingCS) {
      caseStudyId = existingCS.id;
      await supabase
        .from('case_studies')
        .update({
          ...payload.caseStudyRecord,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseStudyId);
    } else {
      const { data: newCS, error: csInsertErr } = await supabase
        .from('case_studies')
        .insert({
          project_id: project.id,
          ...payload.caseStudyRecord,
        })
        .select('id')
        .single();

      if (csInsertErr) throw csInsertErr;
      caseStudyId = newCS.id;
    }

    // 3. Clear existing sections for clean re-insertion to avoid orphans
    const { data: oldSections } = await supabase
      .from('case_study_sections')
      .select('id')
      .eq('case_study_id', caseStudyId);

    if (oldSections && oldSections.length > 0) {
      const oldSecIds = oldSections.map((s) => s.id);
      await supabase.from('section_blocks').delete().in('section_id', oldSecIds);
      await supabase.from('case_study_sections').delete().eq('case_study_id', caseStudyId);
    }

    // 4. Insert sections & blocks sequentially
    let totalSections = 0;
    let totalBlocks = 0;

    for (let sIdx = 0; sIdx < payload.sections.length; sIdx++) {
      const sec = payload.sections[sIdx];
      const { data: secRow, error: secErr } = await supabase
        .from('case_study_sections')
        .insert({
          case_study_id: caseStudyId,
          section_type: sec.section_type,
          title: sec.title,
          eyebrow: sec.eyebrow,
          order_index: sec.order_index,
          is_visible: sec.is_visible,
        })
        .select('id')
        .single();

      if (secErr) throw secErr;
      totalSections++;

      if (sec.blocks && sec.blocks.length > 0) {
        const blocksToInsert = sec.blocks.map((b) => ({
          section_id: secRow.id,
          block_type: b.block_type,
          content: b.content,
          order_index: b.order_index,
          is_visible: b.is_visible,
        }));

        const { error: blkErr } = await supabase
          .from('section_blocks')
          .insert(blocksToInsert);

        if (blkErr) throw blkErr;
        totalBlocks += blocksToInsert.length;
      }
    }

    return {
      success: true,
      slug,
      caseStudyId,
      sectionsCount: totalSections,
      blocksCount: totalBlocks,
    };
  } catch (err) {
    return {
      success: false,
      slug,
      error: err.message || String(err),
    };
  }
}

/**
 * Explicit batch migration runner for all 7 standard case studies.
 */
export async function migrateAllStandardCaseStudies() {
  const results = [];
  for (const slug of STANDARD_CASE_STUDY_SLUGS) {
    const res = await migrateStandardCaseStudy(slug);
    results.push(res);
  }
  return results;
}
