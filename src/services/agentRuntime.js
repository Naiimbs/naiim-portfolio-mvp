import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Fallback MCP Connections when Supabase is offline / unconfigured
export const localMCPConnections = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'n8n Main Instance',
    slug: 'n8n-main',
    provider: 'n8n',
    connection_key: 'n8n-main',
    server_url_hint: 'https://n8n.naiimbsili.com',
    description: 'Primary production n8n server hosting Copilot agent workflow and vector tools.',
    status: 'active',
    is_active: true,
  },
];

// Fallback Agent Runtime Configs when Supabase is offline / unconfigured
export const localAgentRuntimeConfigs = {
  'naim-copilot': {
    agent_id: '10000000-0000-0000-0000-000000000001',
    agent_slug: 'naim-copilot',
    runtime_type: 'mcp',
    mcp_connection_id: '20000000-0000-0000-0000-000000000001',
    mcp_connection_key: 'n8n-main',
    default_tool: 'search_projects',
    allowed_tools: [
      'search_projects',
      'search_workflows',
      'search_nodes',
      'get_workflow_best_practices',
      'ask_copilot_assistant',
      'query_knowledge_base',
      'get_copilot_summary',
    ],
    timeout_ms: 30000,
    max_input_length: 1000,
    is_enabled: true,
  },
  'career-os': {
    agent_id: '10000000-0000-0000-0000-000000000002',
    agent_slug: 'career-os',
    runtime_type: 'none',
    mcp_connection_id: null,
    mcp_connection_key: null,
    default_tool: null,
    allowed_tools: [],
    timeout_ms: 30000,
    max_input_length: 500,
    is_enabled: false,
  },
};

/**
 * Fetch all MCP connections for Admin CMS.
 */
export async function getAdminMCPConnections() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localMCPConnections, error: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('mcp_connections')
      .select(`
        *,
        agent_runtime_configs(
          id,
          agent_id,
          is_enabled,
          agents(name, slug)
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: localMCPConnections, error, source: 'supabase_error' };
    }

    return { data: data || [], error: null, source: 'supabase' };
  } catch (err) {
    return { data: localMCPConnections, error: err, source: 'error' };
  }
}

/**
 * Fetch a single MCP connection by ID or Slug.
 */
export async function getAdminMCPConnectionById(idOrSlug) {
  if (!isSupabaseConfigured || !supabase) {
    const match = localMCPConnections.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    return { data: match || null, error: null, source: 'local' };
  }

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let query = supabase.from('mcp_connections').select('*');

    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      const match = localMCPConnections.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
      return { data: match || null, error: null, source: 'local_fallback' };
    }

    return { data, error: null, source: 'supabase' };
  } catch (err) {
    const match = localMCPConnections.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    return { data: match || null, error: null, source: 'local_fallback' };
  }
}

/**
 * Save / update an MCP connection record.
 */
export async function saveAdminMCPConnection(connectionId, payload) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { id: connectionId || 'local-conn', ...payload }, error: null, source: 'local_simulated' };
  }

  try {
    const isUUID = connectionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(connectionId);
    const connFields = {
      name: payload.name,
      slug: payload.slug,
      provider: payload.provider || 'n8n',
      connection_key: payload.connection_key,
      server_url_hint: payload.server_url_hint || null,
      description: payload.description || '',
      status: payload.status || 'active',
      is_active: payload.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (isUUID) {
      const { data, error } = await supabase
        .from('mcp_connections')
        .update(connFields)
        .eq('id', connectionId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } else {
      const { data, error } = await supabase
        .from('mcp_connections')
        .insert(connFields)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    }
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Delete an MCP connection.
 */
export async function deleteAdminMCPConnection(id) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { id }, error: null };
  }

  try {
    const { error } = await supabase.from('mcp_connections').delete().eq('id', id);
    return { data: { id }, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetch runtime configuration for a specific agent.
 */
export async function getAgentRuntimeConfig(agentId) {
  if (!agentId) return { data: null };

  if (!isSupabaseConfigured || !supabase) {
    return { data: null, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('agent_runtime_configs')
      .select(`
        *,
        mcp_connection:mcp_connection_id(*)
      `)
      .eq('agent_id', agentId)
      .maybeSingle();

    if (error || !data) {
      return { data: null, error };
    }

    return { data, error: null, source: 'supabase' };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetch runtime configuration by agent slug.
 */
export async function getAgentRuntimeConfigBySlug(slug) {
  if (!slug) return { data: null };

  if (!isSupabaseConfigured || !supabase) {
    const match = localAgentRuntimeConfigs[slug] || null;
    return { data: match, source: 'local' };
  }

  try {
    const { data: agent } = await supabase
      .from('agents')
      .select('id, slug, name')
      .eq('slug', slug)
      .maybeSingle();

    if (!agent) {
      const match = localAgentRuntimeConfigs[slug] || null;
      return { data: match, source: 'local_fallback' };
    }

    const { data: runtime, error } = await supabase
      .from('agent_runtime_configs')
      .select(`
        *,
        mcp_connection:mcp_connection_id(*)
      `)
      .eq('agent_id', agent.id)
      .maybeSingle();

    if (error || !runtime) {
      const match = localAgentRuntimeConfigs[slug] || null;
      return { data: match, source: 'local_fallback' };
    }

    return {
      data: {
        ...runtime,
        agent_slug: agent.slug,
        agent_name: agent.name,
      },
      error: null,
      source: 'supabase',
    };
  } catch (err) {
    const match = localAgentRuntimeConfigs[slug] || null;
    return { data: match, source: 'local_fallback' };
  }
}

/**
 * Save or update an agent's runtime configuration.
 */
export async function saveAgentRuntimeConfig(agentId, payload) {
  if (!agentId) return { data: null, error: new Error('agentId is required') };

  if (!isSupabaseConfigured || !supabase) {
    return { data: { agent_id: agentId, ...payload }, error: null, source: 'local_simulated' };
  }

  try {
    const runtimeFields = {
      agent_id: agentId,
      runtime_type: payload.runtime_type || 'none',
      mcp_connection_id: payload.mcp_connection_id || null,
      default_tool: payload.default_tool || null,
      allowed_tools: Array.isArray(payload.allowed_tools) ? payload.allowed_tools : [],
      timeout_ms: Number(payload.timeout_ms) || 30000,
      max_input_length: Number(payload.max_input_length) || 1000,
      is_enabled: Boolean(payload.is_enabled),
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('agent_runtime_configs')
      .select('id')
      .eq('agent_id', agentId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('agent_runtime_configs')
        .update(runtimeFields)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } else {
      const { data, error } = await supabase
        .from('agent_runtime_configs')
        .insert(runtimeFields)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    }
  } catch (err) {
    return { data: null, error: err };
  }
}
