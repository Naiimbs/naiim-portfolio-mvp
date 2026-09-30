import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Server-side Generic Connection & Secret Resolver for MCP Connections V2.
 *
 * Responsibilities:
 * 1. Resolve safe connection keys (e.g. 'n8n-main', 'gmail-main') to server-side credentials.
 * 2. Keep sensitive tokens, refresh tokens, client secrets strictly server-side.
 * 3. Support multiple auth_types ('bearer', 'oauth2') with automatic token refresh lifecycle.
 * 4. Generate & validate CSRF-protected OAuth state tokens.
 * 5. Exchange OAuth authorization codes for access & refresh tokens server-side.
 * 6. Never leak credentials to browser, React state, or client endpoints.
 */

// In-memory OAuth State Map (CSRF prevention, 10 min TTL)
const oauthStateMap = new Map();
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

// In-memory connection status overrides (e.g. needs_reauthorization)
const connectionStatusMap = new Map();

// Helper to ensure .env variables are loaded in server runtime
export function ensureEnvLoaded() {
  try {
    const rootEnvPath = path.resolve(process.cwd(), '.env');
    const serverSecretsPath = path.resolve(process.cwd(), 'server', '.secrets.env');

    const loadFromFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const equalsIdx = trimmed.indexOf('=');
        if (equalsIdx > 0) {
          const key = trimmed.slice(0, equalsIdx).trim();
          let val = trimmed.slice(equalsIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key] || process.env[key] === '') {
            process.env[key] = val;
          }
        }
      }
    };

    loadFromFile(rootEnvPath);
    loadFromFile(serverSecretsPath);
  } catch (e) {
    // Ignore in environments without filesystem access
  }
}

/**
 * Returns environment variable mappings for a given connection key.
 * Guarantees backward compatibility for n8n-main.
 */
function getConnectionEnvMapping(connectionKey = 'n8n-main') {
  if (connectionKey === 'n8n-main') {
    return {
      serverUrlEnv: 'N8N_MCP_SERVER_URL',
      tokenEnv: 'N8N_MCP_ACCESS_TOKEN',
      authTypeEnv: 'N8N_MCP_AUTH_TYPE',
      clientIdEnv: 'N8N_MCP_CLIENT_ID',
      clientSecretEnv: 'N8N_MCP_CLIENT_SECRET',
      authUrlEnv: 'N8N_MCP_AUTH_URL',
      tokenUrlEnv: 'N8N_MCP_TOKEN_URL',
      scopesEnv: 'N8N_MCP_SCOPES',
      redirectUriEnv: 'N8N_MCP_REDIRECT_URI',
      refreshTokenEnv: 'N8N_MCP_REFRESH_TOKEN',
      expiresAtEnv: 'N8N_MCP_EXPIRES_AT',
    };
  }

  const prefix = connectionKey.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return {
    serverUrlEnv: `${prefix}_SERVER_URL`,
    tokenEnv: `${prefix}_ACCESS_TOKEN`,
    authTypeEnv: `${prefix}_AUTH_TYPE`,
    clientIdEnv: `${prefix}_CLIENT_ID`,
    clientSecretEnv: `${prefix}_CLIENT_SECRET`,
    authUrlEnv: `${prefix}_AUTH_URL`,
    tokenUrlEnv: `${prefix}_TOKEN_URL`,
    scopesEnv: `${prefix}_SCOPES`,
    redirectUriEnv: `${prefix}_REDIRECT_URI`,
    refreshTokenEnv: `${prefix}_REFRESH_TOKEN`,
    expiresAtEnv: `${prefix}_EXPIRES_AT`,
  };
}

/**
 * Refreshes an expired OAuth token using the refresh_token.
 */
async function refreshOAuthToken(connectionKey, { tokenUrl, refreshToken, clientId, clientSecret }) {
  if (!tokenUrl || !refreshToken || !clientId || !clientSecret) {
    connectionStatusMap.set(connectionKey, 'needs_reauthorization');
    return null;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      console.warn(`[MCP OAuth] Token refresh failed for "${connectionKey}" (HTTP ${res.status})`);
      connectionStatusMap.set(connectionKey, 'needs_reauthorization');
      return null;
    }

    const data = await res.json();
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token || refreshToken;
    const expiresIn = Number(data.expires_in) || 3600;
    const newExpiresAt = Date.now() + expiresIn * 1000;

    if (newAccessToken) {
      saveMCPConnectionSecrets(connectionKey, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt.toString(),
      });
      connectionStatusMap.set(connectionKey, 'connected');
      return newAccessToken;
    }
  } catch (err) {
    console.error(`[MCP OAuth] Error refreshing token for "${connectionKey}":`, err.message);
    connectionStatusMap.set(connectionKey, 'needs_reauthorization');
  }

  return null;
}

/**
 * Resolves server-only secrets for a given connection key.
 * Implements token lifecycle check and auto-refresh for OAuth 2.0.
 *
 * @param {string} connectionKey - e.g. 'n8n-main'
 * @returns {Promise<{
 *   connectionKey: string,
 *   transport: string,
 *   authType: string,
 *   serverUrl: string|null,
 *   accessToken: string|null,
 *   refreshToken: string|null,
 *   clientId: string|null,
 *   clientSecret: string|null,
 *   authorizationUrl: string|null,
 *   tokenUrl: string|null,
 *   scopes: string|null,
 *   redirectUri: string|null,
 *   expiresAt: number|null,
 *   isConfigured: boolean,
 *   status: string
 * }>}
 */
export async function resolveMCPConnection(connectionKey = 'n8n-main') {
  ensureEnvLoaded();
  const mapping = getConnectionEnvMapping(connectionKey);

  const serverUrl = (process.env[mapping.serverUrlEnv] || (connectionKey === 'n8n-main' ? process.env.N8N_MCP_SERVER_URL : null) || '').trim() || null;
  let accessToken = (process.env[mapping.tokenEnv] || (connectionKey === 'n8n-main' ? process.env.N8N_MCP_ACCESS_TOKEN : null) || '').trim() || null;
  const authType = (process.env[mapping.authTypeEnv] || 'bearer').trim().toLowerCase();

  const clientId = (process.env[mapping.clientIdEnv] || '').trim() || null;
  const clientSecret = (process.env[mapping.clientSecretEnv] || '').trim() || null;
  const authorizationUrl = (process.env[mapping.authUrlEnv] || '').trim() || null;
  const tokenUrl = (process.env[mapping.tokenUrlEnv] || '').trim() || null;
  const scopes = (process.env[mapping.scopesEnv] || '').trim() || null;
  const redirectUri = (process.env[mapping.redirectUriEnv] || '').trim() || null;
  const refreshToken = (process.env[mapping.refreshTokenEnv] || '').trim() || null;
  const rawExpiresAt = (process.env[mapping.expiresAtEnv] || '').trim();
  const expiresAt = rawExpiresAt ? Number(rawExpiresAt) : null;

  let status = connectionStatusMap.get(connectionKey) || (serverUrl && accessToken ? 'connected' : 'not_connected');

  // OAuth 2.0 Token Lifecycle
  if (authType === 'oauth2') {
    if (!serverUrl) {
      status = 'not_connected';
    } else if (accessToken) {
      // Check if access token is expired or expiring within 60s
      if (expiresAt && Date.now() > expiresAt - 60000) {
        if (refreshToken && tokenUrl) {
          const refreshed = await refreshOAuthToken(connectionKey, {
            tokenUrl,
            refreshToken,
            clientId,
            clientSecret,
          });
          if (refreshed) {
            accessToken = refreshed;
            status = 'connected';
          } else {
            status = 'needs_reauthorization';
          }
        } else {
          status = 'needs_reauthorization';
        }
      } else {
        status = 'connected';
      }
    } else if (clientId && clientSecret) {
      status = 'not_connected';
    } else {
      status = 'not_connected';
    }
  }

  const isConfigured = Boolean(
    serverUrl && (authType === 'oauth2' ? Boolean(accessToken || (clientId && clientSecret)) : Boolean(accessToken))
  );

  return {
    connectionKey,
    transport: 'http',
    authType,
    serverUrl,
    accessToken,
    refreshToken,
    clientId,
    clientSecret,
    authorizationUrl,
    tokenUrl,
    scopes,
    redirectUri,
    expiresAt,
    isConfigured,
    status,
  };
}

/**
 * Returns safe diagnostic connection info without secret values.
 * Frontend NEVER receives access tokens, refresh tokens, client secrets, or OAuth secrets.
 */
export async function getSafeConnectionInfo(connectionKey = 'n8n-main') {
  const resolved = await resolveMCPConnection(connectionKey);
  let host = null;
  let path = null;

  if (resolved.serverUrl) {
    try {
      const parsed = new URL(resolved.serverUrl);
      host = parsed.host;
      path = parsed.pathname;
    } catch {
      host = 'invalid-url';
    }
  }

  return {
    connectionKey,
    transport: resolved.transport || 'http',
    authType: resolved.authType || 'bearer',
    isConfigured: resolved.isConfigured,
    hasToken: Boolean(resolved.accessToken),
    hasOAuthConfig: Boolean(resolved.clientId && resolved.authorizationUrl && resolved.tokenUrl),
    isOAuthConnected: Boolean(resolved.authType === 'oauth2' && resolved.accessToken),
    status: resolved.status,
    expiresAt: resolved.expiresAt || null,
    host,
    path,
    clientId: resolved.clientId || null,
    scopes: resolved.scopes || null,
    authorizationUrl: resolved.authorizationUrl || null,
    tokenUrl: resolved.tokenUrl || null,
    redirectUri: resolved.redirectUri || null,
  };
}

/**
 * Safely persists MCP server credentials server-side.
 * Updates both process.env and .env file. Never returns secrets to callers.
 */
export function saveMCPConnectionSecrets(connectionKey = 'n8n-main', secrets = {}) {
  ensureEnvLoaded();
  const mapping = getConnectionEnvMapping(connectionKey);

  const updates = [];

  const checkAndSet = (envKey, val, fallbackKey = null) => {
    if (val !== undefined) {
      const cleanVal = val !== null ? String(val).trim() : '';
      process.env[envKey] = cleanVal;
      updates.push({ key: envKey, val: cleanVal });
      if (fallbackKey && connectionKey === 'n8n-main') {
        process.env[fallbackKey] = cleanVal;
        updates.push({ key: fallbackKey, val: cleanVal });
      }
    }
  };

  checkAndSet(mapping.serverUrlEnv, secrets.serverUrl, 'N8N_MCP_SERVER_URL');
  checkAndSet(mapping.tokenEnv, secrets.accessToken, 'N8N_MCP_ACCESS_TOKEN');
  checkAndSet(mapping.authTypeEnv, secrets.authType);
  checkAndSet(mapping.clientIdEnv, secrets.clientId);
  checkAndSet(mapping.clientSecretEnv, secrets.clientSecret);
  checkAndSet(mapping.authUrlEnv, secrets.authorizationUrl);
  checkAndSet(mapping.tokenUrlEnv, secrets.tokenUrl);
  checkAndSet(mapping.scopesEnv, secrets.scopes);
  checkAndSet(mapping.redirectUriEnv, secrets.redirectUri);
  checkAndSet(mapping.refreshTokenEnv, secrets.refreshToken);
  checkAndSet(mapping.expiresAtEnv, secrets.expiresAt);

  // Update in-memory status
  if (secrets.status) {
    connectionStatusMap.set(connectionKey, secrets.status);
  } else if (secrets.accessToken) {
    connectionStatusMap.set(connectionKey, 'connected');
  }

  // Persist into server/.secrets.env (avoids triggering Vite root .env reload)
  try {
    const serverDir = path.resolve(process.cwd(), 'server');
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    const secretsPath = path.resolve(serverDir, '.secrets.env');
    let content = fs.existsSync(secretsPath) ? fs.readFileSync(secretsPath, 'utf-8') : '';

    const updateOrAppend = (key, val) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, () => `${key}=${val}`);
      } else {
        content = (content.endsWith('\n') || !content ? content : content + '\n') + `${key}=${val}\n`;
      }
    };

    for (const item of updates) {
      updateOrAppend(item.key, item.val);
    }

    fs.writeFileSync(secretsPath, content, 'utf-8');
  } catch (e) {
    // Non-blocking in serverless/readonly environments
  }

  return {
    connectionKey,
    isConfigured: Boolean(process.env[mapping.serverUrlEnv] || (connectionKey === 'n8n-main' && process.env.N8N_MCP_SERVER_URL)),
    authType: process.env[mapping.authTypeEnv] || 'bearer',
  };
}

/**
 * Creates a cryptographically secure, short-lived OAuth state token for CSRF protection.
 *
 * @param {string} connectionKey
 * @param {string} redirectUri
 * @returns {string} state token
 */
export function createOAuthState(connectionKey, redirectUri = '') {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStateMap.set(state, {
    connectionKey,
    redirectUri,
    createdAt: Date.now(),
  });

  // Cleanup states older than TTL
  const now = Date.now();
  for (const [s, data] of oauthStateMap.entries()) {
    if (now - data.createdAt > OAUTH_STATE_TTL_MS) {
      oauthStateMap.delete(s);
    }
  }

  return state;
}

/**
 * Validates and consumes an OAuth state token.
 * Single-use token to prevent replay and CSRF attacks.
 *
 * @param {string} state
 * @returns {{ connectionKey: string, redirectUri: string }|null}
 */
export function validateAndConsumeOAuthState(state) {
  if (!state || typeof state !== 'string') return null;

  const data = oauthStateMap.get(state);
  if (!data) return null;

  // Single-use: remove immediately
  oauthStateMap.delete(state);

  if (Date.now() - data.createdAt > OAUTH_STATE_TTL_MS) {
    return null; // Expired
  }

  return data;
}

/**
 * Exchanges an OAuth 2.0 authorization code for access and refresh tokens.
 * Stored strictly server-side.
 *
 * @param {{ connectionKey: string, code: string, redirectUri: string }} param0
 */
export async function exchangeOAuthCode({ connectionKey, code, redirectUri }) {
  const resolved = await resolveMCPConnection(connectionKey);

  const tokenUrl = resolved.tokenUrl;
  const clientId = resolved.clientId;
  const clientSecret = resolved.clientSecret;

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error('OAuth configuration missing on server (tokenUrl, clientId, or clientSecret).');
  }

  const effectiveRedirect = redirectUri || resolved.redirectUri;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
  });

  if (effectiveRedirect) {
    params.set('redirect_uri', effectiveRedirect);
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let msg = `HTTP ${res.status}`;
    try {
      const errJson = JSON.parse(errorText);
      msg = errJson.error_description || errJson.error || msg;
    } catch {
      // ignore
    }
    throw new Error(`OAuth token exchange failed: ${msg}`);
  }

  const data = await res.json();
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token || null;
  const expiresIn = Number(data.expires_in) || 3600;
  const expiresAt = Date.now() + expiresIn * 1000;

  if (!accessToken) {
    throw new Error('No access_token returned by authorization server.');
  }

  // Persist server-side
  saveMCPConnectionSecrets(connectionKey, {
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toString(),
    status: 'connected',
  });

  connectionStatusMap.set(connectionKey, 'connected');

  return {
    connectionKey,
    success: true,
  };
}

/**
 * Reads all stored connections metadata.
 * Persisted in server/.connections.json (safe metadata only, never contains secrets).
 */
export function listMCPConnections() {
  ensureEnvLoaded();
  const connectionsPath = path.resolve(process.cwd(), 'server', '.connections.json');
  let records = [];

  if (fs.existsSync(connectionsPath)) {
    try {
      const raw = fs.readFileSync(connectionsPath, 'utf-8');
      records = JSON.parse(raw);
    } catch {
      records = [];
    }
  }

  // Ensure default n8n-main is present if missing
  const hasN8n = records.some((r) => r.slug === 'n8n-main' || r.connection_key === 'n8n-main');
  if (!hasN8n) {
    records.unshift({
      id: '20000000-0000-0000-0000-000000000001',
      name: 'n8n Main Instance',
      slug: 'n8n-main',
      connection_key: 'n8n-main',
      provider: 'n8n',
      transport: 'http',
      auth_type: 'bearer',
      server_url: process.env.N8N_MCP_SERVER_URL || 'https://bsyna.app.n8n.cloud/mcp-server/http',
      server_url_hint: process.env.N8N_MCP_SERVER_URL || 'https://bsyna.app.n8n.cloud/mcp-server/http',
      description: 'Primary production n8n server hosting Copilot agent workflow and vector tools.',
      status: 'active',
      is_active: true,
      metadata: {},
      created_at: '2026-09-30T00:00:00.000Z',
      updated_at: new Date().toISOString(),
    });
  }

  // Check if gmail-main is configured via environment variables but not yet in records
  const hasGmail = records.some((r) => r.slug === 'gmail-main' || r.connection_key === 'gmail-main');
  if (!hasGmail && process.env.GMAIL_MAIN_CLIENT_ID) {
    records.push({
      id: '20000000-0000-0000-0000-000000000002',
      name: 'Gmail MCP Client',
      slug: 'gmail-main',
      connection_key: 'gmail-main',
      provider: 'gmail',
      transport: 'http',
      auth_type: 'oauth2',
      server_url: process.env.GMAIL_MAIN_SERVER_URL || '',
      server_url_hint: process.env.GMAIL_MAIN_SERVER_URL || '',
      description: 'Gmail MCP integration authorized via Google Cloud OAuth 2.0.',
      status: process.env.GMAIL_MAIN_ACCESS_TOKEN ? 'connected' : 'not_connected',
      is_active: true,
      metadata: {
        client_id: process.env.GMAIL_MAIN_CLIENT_ID || '',
        authorization_url: process.env.GMAIL_MAIN_AUTH_URL || 'https://accounts.google.com/o/oauth2/auth',
        token_url: process.env.GMAIL_MAIN_TOKEN_URL || 'https://oauth2.googleapis.com/token',
        scopes: process.env.GMAIL_MAIN_SCOPES || 'https://www.googleapis.com/auth/gmail.readonly',
        redirect_uri: process.env.GMAIL_MAIN_REDIRECT_URI || 'http://localhost:5173/api/oauth/callback',
      },
      created_at: '2026-09-30T00:00:00.000Z',
      updated_at: new Date().toISOString(),
    });
  }

  return records;
}

/**
 * Persists a safe connection metadata record into server/.connections.json.
 * Guarantees no client_secret, access_token, or refresh_token is saved here.
 */
export function saveMCPConnectionRecord(record) {
  ensureEnvLoaded();
  const currentList = listMCPConnections();
  const key = record.slug || record.connection_key || 'conn';

  const safeRecord = {
    id: record.id || `conn-${key}`,
    name: (record.name || key).trim(),
    slug: key,
    connection_key: record.connection_key || key,
    provider: record.provider || 'custom',
    transport: record.transport || 'http',
    auth_type: record.auth_type || 'bearer',
    server_url: (record.server_url || record.server_url_hint || '').trim(),
    server_url_hint: (record.server_url_hint || record.server_url || '').trim(),
    description: (record.description || '').trim(),
    status: record.status || 'not_connected',
    is_active: record.is_active !== false,
    metadata: {
      client_id: record.metadata?.client_id || '',
      authorization_url: record.metadata?.authorization_url || '',
      token_url: record.metadata?.token_url || '',
      scopes: record.metadata?.scopes || '',
      redirect_uri: record.metadata?.redirect_uri || '',
      ...(record.metadata?.redirect_uris ? { redirect_uris: record.metadata.redirect_uris } : {}),
      ...(record.metadata?.app_type ? { app_type: record.metadata.app_type } : {}),
    },
    updated_at: new Date().toISOString(),
  };

  const existingIdx = currentList.findIndex(
    (c) => c.slug === key || c.connection_key === key || (record.id && c.id === record.id)
  );

  if (existingIdx >= 0) {
    currentList[existingIdx] = {
      ...currentList[existingIdx],
      ...safeRecord,
      created_at: currentList[existingIdx].created_at || new Date().toISOString(),
    };
  } else {
    safeRecord.created_at = new Date().toISOString();
    currentList.push(safeRecord);
  }

  const serverDir = path.resolve(process.cwd(), 'server');
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  const connectionsPath = path.resolve(serverDir, '.connections.json');
  fs.writeFileSync(connectionsPath, JSON.stringify(currentList, null, 2), 'utf-8');

  return safeRecord;
}

/**
 * Deletes a connection record from server/.connections.json.
 */
export function deleteMCPConnectionRecord(connectionKey) {
  const currentList = listMCPConnections();
  const filtered = currentList.filter(
    (c) => c.slug !== connectionKey && c.connection_key !== connectionKey && c.id !== connectionKey
  );
  const serverDir = path.resolve(process.cwd(), 'server');
  const connectionsPath = path.resolve(serverDir, '.connections.json');
  fs.writeFileSync(connectionsPath, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
