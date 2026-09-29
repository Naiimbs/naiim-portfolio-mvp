import fs from 'node:fs';
import path from 'node:path';

/**
 * Server-side Secret Resolver for MCP Connections.
 *
 * Responsibilities:
 * 1. Resolve safe connection keys (e.g., 'n8n-main') to server-side credentials.
 * 2. Keep sensitive access tokens strictly inside Node process.env.
 * 3. Never return or expose tokens to client applications.
 * 4. Extensible to Vault, AWS Secrets Manager, or Docker secrets in the future.
 */

// Helper to ensure .env variables are loaded in server runtime
function ensureEnvLoaded() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
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
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    // Ignore error in environments without filesystem access
  }
}

// Connection key to server environment variable mappings
const CONNECTION_ENV_MAP = {
  'n8n-main': {
    serverUrlEnv: 'N8N_MCP_SERVER_URL',
    tokenEnv: 'N8N_MCP_ACCESS_TOKEN',
  },
  'n8n-secondary': {
    serverUrlEnv: 'N8N_MCP_SECONDARY_URL',
    tokenEnv: 'N8N_MCP_SECONDARY_TOKEN',
  },
  'custom-mcp': {
    serverUrlEnv: 'CUSTOM_MCP_SERVER_URL',
    tokenEnv: 'CUSTOM_MCP_ACCESS_TOKEN',
  },
};

/**
 * Resolves server-only secrets for a given connection key.
 *
 * @param {string} connectionKey - e.g. 'n8n-main'
 * @returns {{ serverUrl: string|null, accessToken: string|null, isConfigured: boolean }}
 */
export function resolveMCPConnection(connectionKey = 'n8n-main') {
  ensureEnvLoaded();
  const envMapping = CONNECTION_ENV_MAP[connectionKey] || {
    serverUrlEnv: `${connectionKey.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_SERVER_URL`,
    tokenEnv: `${connectionKey.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_ACCESS_TOKEN`,
  };

  const serverUrl = process.env[envMapping.serverUrlEnv] || process.env.N8N_MCP_SERVER_URL || null;
  const accessToken = process.env[envMapping.tokenEnv] || process.env.N8N_MCP_ACCESS_TOKEN || null;

  return {
    connectionKey,
    serverUrl: serverUrl ? serverUrl.trim() : null,
    accessToken: accessToken ? accessToken.trim() : null,
    isConfigured: Boolean(serverUrl),
  };
}

/**
 * Returns safe diagnostic connection info without secret values.
 */
export function getSafeConnectionInfo(connectionKey = 'n8n-main') {
  const resolved = resolveMCPConnection(connectionKey);
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
    isConfigured: resolved.isConfigured,
    hasToken: Boolean(resolved.accessToken),
    host,
    path,
  };
}
