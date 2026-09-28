import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { agents as localAgents } from '../data/agents';

/**
 * Fetch all published agents for the public /agents page.
 */
export async function getPublishedAgents() {
  if (!isSupabaseConfigured || !supabase) {
    const published = localAgents.filter((a) => a.status === 'published');
    return { data: published, isCMS: false, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        thumbnail_media:thumbnail_media_id(*),
        hero_media:hero_media_id(*)
      `)
      .eq('status', 'published')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      const published = localAgents.filter((a) => a.status === 'published');
      return { data: published, isCMS: false, source: 'local_fallback' };
    }

    return { data, isCMS: true, source: 'supabase' };
  } catch (err) {
    const published = localAgents.filter((a) => a.status === 'published');
    return { data: published, isCMS: false, source: 'local_fallback' };
  }
}

/**
 * Fetch a single published agent with case study sections and blocks.
 */
export async function getPublishedAgentBySlug(slug) {
  if (!slug) return { data: null, isCMS: false };

  if (!isSupabaseConfigured || !supabase) {
    const match = localAgents.find((a) => a.slug === slug) || null;
    return { data: match, isCMS: false, source: 'local' };
  }

  try {
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        *,
        thumbnail_media:thumbnail_media_id(*),
        hero_media:hero_media_id(*)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (agentError || !agent) {
      const match = localAgents.find((a) => a.slug === slug) || null;
      return { data: match, isCMS: false, source: 'local_fallback' };
    }

    const { data: caseStudy, error: csError } = await supabase
      .from('agent_case_studies')
      .select(`
        *,
        hero_media:hero_media_id(*),
        sections:agent_case_study_sections(
          *,
          blocks:agent_section_blocks(*)
        )
      `)
      .eq('agent_id', agent.id)
      .eq('status', 'published')
      .maybeSingle();

    if (csError || !caseStudy) {
      // Return top-level agent data with fallback sections if available
      const localMatch = localAgents.find((a) => a.slug === slug);
      const combined = {
        ...agent,
        sections: localMatch?.sections || [],
      };
      return { data: combined, isCMS: true, source: 'supabase_partial' };
    }

    // Format & sort sections + blocks
    const formatted = {
      ...agent,
      case_study: caseStudy,
      sections: caseStudy.sections || [],
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

    return { data: formatted, isCMS: true, source: 'supabase' };
  } catch (err) {
    const match = localAgents.find((a) => a.slug === slug) || null;
    return { data: match, isCMS: false, source: 'local_fallback' };
  }
}

/**
 * Fetch all agents for Admin CMS directory.
 */
export async function getAdminAgents() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localAgents, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        thumbnail_media:thumbnail_media_id(id, public_url),
        case_study:agent_case_studies(id)
      `)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: localAgents, error, source: 'supabase_error' };
    }

    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: localAgents, error: err, source: 'error' };
  }
}

/**
 * Fetch a single agent by ID or Slug for Admin Agent Editor.
 */
export async function getAdminAgentById(idOrSlug) {
  if (!isSupabaseConfigured || !supabase) {
    const match = localAgents.find((a) => a.id === idOrSlug || a.slug === idOrSlug) || null;
    return { data: match, error: null, source: 'local' };
  }

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase
      .from('agents')
      .select(`
        *,
        thumbnail_media:thumbnail_media_id(*),
        hero_media:hero_media_id(*),
        case_study:agent_case_studies(
          *,
          sections:agent_case_study_sections(
            *,
            blocks:agent_section_blocks(*)
          )
        )
      `);

    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      const match = localAgents.find((a) => a.id === idOrSlug || a.slug === idOrSlug) || null;
      return { data: match, error: null, source: 'local_fallback' };
    }

    const sections = data.case_study?.sections || [];
    sections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    sections.forEach((s) => {
      if (s.blocks) {
        s.blocks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
    });

    return {
      data: {
        ...data,
        sections,
      },
      error: null,
      source: 'supabase',
    };
  } catch (err) {
    const match = localAgents.find((a) => a.id === idOrSlug || a.slug === idOrSlug) || null;
    return { data: match, error: null, source: 'local_fallback' };
  }
}

/**
 * Create or update an AI Agent record and its case study graph.
 */
export async function saveAdminAgent(agentId, payload) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { id: agentId || 'local-agent', ...payload }, error: null, source: 'local_simulated' };
  }

  try {
    let currentAgentId = agentId;

    const agentFields = {
      slug: payload.slug,
      name: payload.name,
      short_description: payload.short_description,
      description: payload.description,
      category: payload.category || 'AI Agent',
      status: payload.status || 'draft',
      year: payload.year || new Date().getFullYear(),
      role: payload.role || '',
      tools: payload.tools || [],
      workflow_platform: payload.workflow_platform || 'n8n',
      thumbnail_media_id: payload.thumbnail_media_id || null,
      hero_media_id: payload.hero_media_id || null,
      demo_type: payload.demo_type || 'none',
      demo_url: payload.demo_url || null,
      github_url: payload.github_url || null,
      n8n_workflow_url: payload.n8n_workflow_url || null,
      is_featured: Boolean(payload.is_featured),
      sort_order: payload.sort_order || 0,
      seo_title: payload.seo_title || `${payload.name} — AI Agent`,
      seo_description: payload.seo_description || payload.short_description || '',
      canonical_path: payload.canonical_path || `/agents/${payload.slug}`,
      updated_at: new Date().toISOString(),
    };

    const isUUID = agentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);

    if (isUUID) {
      const { data: updated, error: updErr } = await supabase
        .from('agents')
        .update(agentFields)
        .eq('id', agentId)
        .select()
        .single();
      if (updErr) throw updErr;
      currentAgentId = updated.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from('agents')
        .insert(agentFields)
        .select()
        .single();
      if (createErr) throw createErr;
      currentAgentId = created.id;
    }

    // Upsert agent case study record
    let caseStudyId = null;
    const { data: existingCS } = await supabase
      .from('agent_case_studies')
      .select('id')
      .eq('agent_id', currentAgentId)
      .maybeSingle();

    if (existingCS) {
      caseStudyId = existingCS.id;
      await supabase
        .from('agent_case_studies')
        .update({
          subtitle: payload.short_description,
          seo_title: payload.seo_title,
          seo_description: payload.seo_description,
          canonical_path: payload.canonical_path,
          status: payload.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseStudyId);
    } else {
      const { data: newCS, error: csCreateErr } = await supabase
        .from('agent_case_studies')
        .insert({
          agent_id: currentAgentId,
          subtitle: payload.short_description,
          seo_title: payload.seo_title,
          seo_description: payload.seo_description,
          canonical_path: payload.canonical_path,
          status: payload.status,
        })
        .select('id')
        .single();
      if (csCreateErr) throw csCreateErr;
      caseStudyId = newCS.id;
    }

    // Persist sections & blocks if provided
    if (Array.isArray(payload.sections)) {
      for (let sIdx = 0; sIdx < payload.sections.length; sIdx++) {
        const sec = payload.sections[sIdx];
        const secPayload = {
          agent_case_study_id: caseStudyId,
          section_type: sec.section_type || 'content',
          title: sec.title || '',
          eyebrow: sec.eyebrow || '',
          order_index: sIdx + 1,
          is_visible: sec.is_visible !== false,
          updated_at: new Date().toISOString(),
        };

        let currentSecId = sec.id;
        const isSecUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sec.id);

        if (isSecUUID) {
          await supabase.from('agent_case_study_sections').upsert({ id: sec.id, ...secPayload });
        } else {
          const { data: newSec, error: nsErr } = await supabase
            .from('agent_case_study_sections')
            .insert(secPayload)
            .select('id')
            .single();
          if (nsErr) throw nsErr;
          currentSecId = newSec.id;
        }

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
              await supabase.from('agent_section_blocks').upsert({ id: blk.id, ...blkPayload });
            } else {
              await supabase.from('agent_section_blocks').insert(blkPayload);
            }
          }
        }
      }
    }

    return { data: { id: currentAgentId, ...payload }, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Delete an agent record.
 */
export async function deleteAdminAgent(id) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { id }, error: null };
  }

  try {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    return { data: { id }, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
