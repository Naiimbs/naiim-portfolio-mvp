import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Fallback MCP Connections when Supabase is offline / unconfigured
export const localMCPConnections = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'n8n Main Instance',
    slug: 'n8n-main',
    provider: 'n8n',
    transport: 'http',
    auth_type: 'bearer',
    connection_key: 'n8n-main',
    server_url: 'https://n8n.naiimbsili.com',
    server_url_hint: 'https://n8n.naiimbsili.com',
    description: 'Primary production n8n server hosting Copilot agent workflow and vector tools.',
    status: 'active',
    is_active: true,
    metadata: {},
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
    default_tool: 'query_knowledge_base',
    allowed_tools: [
      'query_knowledge_base',
      'ask_copilot_assistant',
      'get_copilot_summary',
      'search_projects',
      'search_workflows',
      'search_nodes',
      'get_workflow_best_practices',
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
  // First attempt to fetch from server API (.connections.json / server config)
  try {
    const res = await fetch('/api/admin/mcp-connections');
    if (res.ok) {
      const json = await res.json();
      if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
        return { data: json.data, error: null, source: 'server' };
      }
    }
  } catch (e) {
    // API server not reachable or error, continue
  }

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

    if (error || !data || data.length === 0) {
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
  // First attempt to fetch from server API
  try {
    const res = await fetch(`/api/admin/mcp-connections/${encodeURIComponent(idOrSlug)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data) {
        return { data: json.data, error: null, source: 'server' };
      }
    }
  } catch (e) {
    // continue
  }

  if (!isSupabaseConfigured || !supabase) {
    const match = localMCPConnections.find((c) => c.id === idOrSlug || c.slug === idOrSlug || c.connection_key === idOrSlug);
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
      const match = localMCPConnections.find((c) => c.id === idOrSlug || c.slug === idOrSlug || c.connection_key === idOrSlug);
      return { data: match || null, error: null, source: 'local_fallback' };
    }

    return { data, error: null, source: 'supabase' };
  } catch (err) {
    const match = localMCPConnections.find((c) => c.id === idOrSlug || c.slug === idOrSlug || c.connection_key === idOrSlug);
    return { data: match || null, error: null, source: 'local_fallback' };
  }
}

/**
 * Save / update an MCP connection record.
 */
export async function saveAdminMCPConnection(connectionId, payload) {
  const targetSlug = payload.slug || payload.connection_key || 'n8n-main';
  const targetKey = payload.connection_key || targetSlug;

  const connFields = {
    id: connectionId || `conn-${targetKey}`,
    name: payload.name,
    slug: targetSlug,
    provider: payload.provider || 'custom',
    transport: payload.transport || 'http',
    auth_type: payload.auth_type || 'bearer',
    connection_key: targetKey,
    server_url: payload.server_url || payload.server_url_hint || null,
    server_url_hint: payload.server_url_hint || payload.server_url || null,
    description: payload.description || '',
    status: payload.status || 'not_connected',
    is_active: payload.is_active !== false,
    metadata: payload.metadata || {},
    updated_at: new Date().toISOString(),
  };

  // 1. Persist to backend server API (.connections.json)
  let savedServerData = null;
  try {
    const res = await fetch('/api/admin/mcp-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connFields),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data) {
        savedServerData = json.data;
      }
    }
  } catch (apiErr) {
    console.warn('[agentRuntime] Server API save failed:', apiErr.message);
  }

  // Update local memory cache as well
  const existingIdx = localMCPConnections.findIndex(
    (c) =>
      c.id === connectionId ||
      (targetSlug && c.slug === targetSlug) ||
      (targetKey && c.connection_key === targetKey)
  );
  if (existingIdx >= 0) {
    localMCPConnections[existingIdx] = {
      ...localMCPConnections[existingIdx],
      ...connFields,
      ...(savedServerData || {}),
    };
  } else {
    localMCPConnections.push({
      ...connFields,
      ...(savedServerData || {}),
    });
  }

  // 2. Best-effort Supabase sync (if configured)
  if (!isSupabaseConfigured || !supabase) {
    return { data: savedServerData || connFields, error: null, source: 'local', isUpdate: existingIdx >= 0 };
  }

  try {
    let targetId = connectionId;

    if (!targetId) {
      const { data: existingBySlug } = await supabase
        .from('mcp_connections')
        .select('id, slug, connection_key')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (existingBySlug?.id) {
        targetId = existingBySlug.id;
      } else if (targetKey) {
        const { data: existingByKey } = await supabase
          .from('mcp_connections')
          .select('id, slug, connection_key')
          .eq('connection_key', targetKey)
          .maybeSingle();

        if (existingByKey?.id) {
          targetId = existingByKey.id;
        }
      }
    }

    if (targetId) {
      const { data, error } = await supabase
        .from('mcp_connections')
        .update(connFields)
        .eq('id', targetId)
        .select()
        .single();

      if (error) {
        console.warn('[agentRuntime] Supabase update failed (likely RLS), using server data:', error.message);
        return { data: savedServerData || connFields, error: null, isUpdate: true };
      }
      return { data, error: null, isUpdate: true };
    }

    const { data, error } = await supabase
      .from('mcp_connections')
      .insert(connFields)
      .select()
      .single();

    if (error) {
      console.warn('[agentRuntime] Supabase insert failed (likely RLS), using server data:', error.message);
      return { data: savedServerData || connFields, error: null, isUpdate: false };
    }

    return { data, error: null, isUpdate: false };
  } catch (err) {
    console.warn('[agentRuntime] Supabase error, falling back to server data:', err.message);
    return { data: savedServerData || connFields, error: null, isUpdate: false };
  }
}

/**
 * Delete an MCP connection.
 */
export async function deleteAdminMCPConnection(id) {
  try {
    await fetch(`/api/admin/mcp-connections/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (e) {
    // ignore
  }

  const idx = localMCPConnections.findIndex((c) => c.id === id || c.slug === id || c.connection_key === id);
  if (idx >= 0) localMCPConnections.splice(idx, 1);

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
