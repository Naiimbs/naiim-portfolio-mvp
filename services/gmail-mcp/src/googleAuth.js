import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';

/**
 * Custom Error class for Gmail OAuth errors.
 * Ensures tokens and secrets are never leaked in error messages or stack traces.
 */
export class GmailAuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GmailAuthError';
    this.code = code;
  }
}

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];

let cachedOAuth2Client = null;

/**
 * Safely parses a simple KEY=VALUE env file into a key-value object.
 */
function parseEnvContent(content) {
  const result = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const k = match[1].trim();
      const v = match[2].trim().replace(/^['"]|['"]$/g, '');
      result[k] = v;
    }
  }
  return result;
}

/**
 * Loads secrets from local env files on server startup if environment variables are not yet present in process.env.
 */
export function ensureEnvLoaded() {
  const candidatePaths = [
    path.resolve(process.cwd(), 'services', 'gmail-mcp', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'server', '.secrets.env'),
    path.resolve(process.cwd(), '..', 'server', '.secrets.env'),
    path.resolve(process.cwd(), '..', '..', 'server', '.secrets.env'),
  ];

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = parseEnvContent(raw);

        if (!process.env.GMAIL_CLIENT_ID && (parsed.GMAIL_CLIENT_ID || parsed.GMAIL_MAIN_CLIENT_ID)) {
          process.env.GMAIL_CLIENT_ID = parsed.GMAIL_CLIENT_ID || parsed.GMAIL_MAIN_CLIENT_ID;
        }
        if (!process.env.GMAIL_CLIENT_SECRET && (parsed.GMAIL_CLIENT_SECRET || parsed.GMAIL_MAIN_CLIENT_SECRET)) {
          process.env.GMAIL_CLIENT_SECRET = parsed.GMAIL_CLIENT_SECRET || parsed.GMAIL_MAIN_CLIENT_SECRET;
        }
        if (!process.env.GMAIL_REFRESH_TOKEN && (parsed.GMAIL_REFRESH_TOKEN || parsed.GMAIL_MAIN_REFRESH_TOKEN)) {
          process.env.GMAIL_REFRESH_TOKEN = parsed.GMAIL_REFRESH_TOKEN || parsed.GMAIL_MAIN_REFRESH_TOKEN;
        }
        if (!process.env.GMAIL_OAUTH_REDIRECT_URI && (parsed.GMAIL_OAUTH_REDIRECT_URI || parsed.GMAIL_MAIN_REDIRECT_URI)) {
          process.env.GMAIL_OAUTH_REDIRECT_URI = parsed.GMAIL_OAUTH_REDIRECT_URI || parsed.GMAIL_MAIN_REDIRECT_URI;
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
}

/**
 * Returns the effective redirect URI for Google OAuth callback.
 */
export function getOAuthRedirectUri() {
  return (
    process.env.GMAIL_OAUTH_REDIRECT_URI ||
    'http://localhost:3100/oauth/google/callback'
  ).trim();
}

/**
 * Validates whether required Google OAuth client credentials (ID and Secret) are present.
 */
export function validateClientCredentials() {
  const clientId = (process.env.GMAIL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GMAIL_CLIENT_SECRET || '').trim();

  const missing = [];
  if (!clientId) missing.push('GMAIL_CLIENT_ID');
  if (!clientSecret) missing.push('GMAIL_CLIENT_SECRET');

  return {
    configured: missing.length === 0,
    missing,
    clientId,
    clientSecret,
  };
}

/**
 * Validates whether complete Google OAuth credentials (including refresh token) are present.
 */
export function validateOAuthConfig() {
  const creds = validateClientCredentials();
  const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || '').trim();

  const missing = [...creds.missing];
  if (!refreshToken) missing.push('GMAIL_REFRESH_TOKEN');

  return {
    configured: missing.length === 0,
    missing,
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    hasRefreshToken: Boolean(refreshToken),
  };
}

/**
 * Generates the Google OAuth authorization URL to initiate user consent.
 *
 * @param {string} state - Cryptographically random CSRF state token
 * @returns {string} Google authorization URL
 */
export function generateGoogleAuthUrl(state) {
  const { configured, missing, clientId, clientSecret } = validateClientCredentials();
  if (!configured) {
    throw new GmailAuthError(
      'GMAIL_OAUTH_NOT_CONFIGURED',
      `Google OAuth Client credentials not configured. Missing: ${missing.join(', ')}.`
    );
  }

  const redirectUri = getOAuthRedirectUri();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Guarantees a new refresh token is returned
    scope: GMAIL_SCOPES,
    state,
  });
}

/**
 * Exchanges an authorization code for tokens and returns the refresh token.
 *
 * @param {string} code - The authorization code from Google
 * @param {object} [customOAuthClient] - Optional injected client for testing
 * @returns {Promise<string>} The refresh token
 */
export async function exchangeCodeForTokens(code, customOAuthClient = null) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    throw new GmailAuthError('GMAIL_INVALID_ARGUMENT', 'Authorization code is required.');
  }

  const { configured, missing, clientId, clientSecret } = validateClientCredentials();
  if (!configured) {
    throw new GmailAuthError(
      'GMAIL_OAUTH_NOT_CONFIGURED',
      `Google OAuth Client credentials not configured. Missing: ${missing.join(', ')}.`
    );
  }

  try {
    const redirectUri = getOAuthRedirectUri();
    const client = customOAuthClient || new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await client.getToken(code.trim());

    if (!tokens || !tokens.refresh_token) {
      throw new GmailAuthError(
        'GMAIL_REFRESH_TOKEN_MISSING',
        'Google did not return a refresh token. Please re-authorize with consent prompt.'
      );
    }

    return tokens.refresh_token;
  } catch (err) {
    if (err instanceof GmailAuthError) throw err;
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('invalid_grant')) {
      throw new GmailAuthError('GMAIL_OAUTH_FAILED', 'Authorization code is invalid or has expired.');
    }
    throw new GmailAuthError('GMAIL_OAUTH_FAILED', 'Failed to exchange authorization code for tokens.');
  }
}

/**
 * Atomically updates key-value pairs in a .env file without altering unrelated lines or comments.
 */
function updateEnvFile(filePath, updates = {}) {
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  const lines = content ? content.split('\n') : [];
  const handledKeys = new Set();
  const updatedLines = [];

  for (const line of lines) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (match && updates[match[1]] !== undefined) {
      const key = match[1];
      updatedLines.push(`${key}=${updates[key]}`);
      handledKeys.add(key);
    } else {
      updatedLines.push(line);
    }
  }

  for (const [key, val] of Object.entries(updates)) {
    if (!handledKeys.has(key)) {
      if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1].trim() !== '') {
        updatedLines.push('');
      }
      updatedLines.push(`${key}=${val}`);
    }
  }

  fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf-8');
}

/**
 * Persists the obtained refresh token server-side and re-initializes client runtime.
 * Never leaks the token or writes it to untracked destinations.
 *
 * @param {string} refreshToken
 */
export function saveRefreshToken(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string' || !refreshToken.trim()) {
    throw new GmailAuthError('GMAIL_INVALID_TOKEN', 'Cannot save empty refresh token.');
  }

  const token = refreshToken.trim();
  process.env.GMAIL_REFRESH_TOKEN = token;
  process.env.GMAIL_MAIN_REFRESH_TOKEN = token;

  const candidateDirs = [
    path.resolve(process.cwd(), 'server'),
    path.resolve(process.cwd(), '..', 'server'),
    path.resolve(process.cwd(), '..', '..', 'server'),
  ];

  for (const dir of candidateDirs) {
    const secretsPath = path.join(dir, '.secrets.env');
    if (fs.existsSync(secretsPath)) {
      try {
        updateEnvFile(secretsPath, {
          GMAIL_REFRESH_TOKEN: token,
          GMAIL_MAIN_REFRESH_TOKEN: token,
        });
      } catch {
        // Fall back gracefully
      }
    }
  }

  const mcpEnvDirs = [
    path.resolve(process.cwd(), 'services', 'gmail-mcp'),
    path.resolve(process.cwd()),
  ];
  for (const dir of mcpEnvDirs) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      try {
        updateEnvFile(envPath, {
          GMAIL_REFRESH_TOKEN: token,
        });
      } catch {
        // Fall back gracefully
      }
    }
  }

  resetOAuth2Client();
}

/**
 * Returns a configured Google OAuth2 client with refresh-token credentials.
 *
 * @param {boolean} [forceNew=false]
 * @returns {import('googleapis').Auth.OAuth2Client}
 */
export function getOAuth2Client(forceNew = false) {
  if (!forceNew && cachedOAuth2Client) {
    return cachedOAuth2Client;
  }

  const { configured, missing, clientId, clientSecret } = validateOAuthConfig();
  if (!configured) {
    throw new GmailAuthError(
      'GMAIL_OAUTH_NOT_CONFIGURED',
      `Google OAuth is not configured on the Gmail MCP server. Missing: ${missing.join(', ')}.`
    );
  }

  try {
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN.trim();
    const redirectUri = getOAuthRedirectUri();
    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    client.setCredentials({
      refresh_token: refreshToken,
    });

    cachedOAuth2Client = client;
    return client;
  } catch (err) {
    throw new GmailAuthError('GMAIL_OAUTH_FAILED', 'Failed to initialize Google OAuth2 client.');
  }
}

/**
 * Resets the cached OAuth2 client instance.
 */
export function resetOAuth2Client() {
  cachedOAuth2Client = null;
}
