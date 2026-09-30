/**
 * Generic OAuth Credentials JSON Parser
 *
 * Designed to parse client credentials files safely and entirely in the browser.
 * Supports Google Cloud OAuth credentials ('installed' and 'web' root objects)
 * and is architected to be easily extensible for additional OAuth providers.
 *
 * CRITICAL SECURITY:
 * - Pure parsing and normalization logic.
 * - Never logs credentials or client secrets.
 * - Never sends raw JSON to any server.
 * - Error messages never leak secret keys or values.
 */

/**
 * Detects the credential format from parsed JSON object.
 *
 * @param {object} parsed
 * @returns {{ format: string, appType: string, payload: object }|null}
 */
export function detectCredentialFormat(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  // Google Cloud Web Application format
  if (parsed.web && typeof parsed.web === 'object' && !Array.isArray(parsed.web)) {
    return {
      format: 'google_web',
      appType: 'Web',
      payload: parsed.web,
    };
  }

  // Google Cloud Installed / Desktop Application format
  if (parsed.installed && typeof parsed.installed === 'object' && !Array.isArray(parsed.installed)) {
    return {
      format: 'google_installed',
      appType: 'Installed',
      payload: parsed.installed,
    };
  }

  // Standard generic OAuth 2.0 client object (extensibility point)
  if (
    parsed.client_id &&
    parsed.client_secret &&
    (parsed.auth_uri || parsed.authorization_endpoint || parsed.token_uri || parsed.token_endpoint)
  ) {
    return {
      format: 'generic_oauth2',
      appType: 'Generic OAuth 2.0',
      payload: parsed,
    };
  }

  return null;
}

/**
 * Parses raw JSON string and normalizes it into safe OAuth configuration.
 *
 * @param {string} jsonString - The raw JSON string from selected file
 * @returns {{
 *   format: string,
 *   appType: string,
 *   clientId: string,
 *   clientSecret: string,
 *   authorizationUrl: string,
 *   tokenUrl: string,
 *   redirectUris: string[],
 *   primaryRedirectUri: string,
 *   maskedSecret: string
 * }}
 * @throws {Error} User-friendly error message if parsing or validation fails
 */
export function parseOAuthCredentialsJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    throw new Error('Please select a valid OAuth credentials JSON file.');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (syntaxErr) {
    throw new Error('The selected file is not valid JSON. Please check file formatting.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('The file is valid JSON but does not contain a supported OAuth credential structure.');
  }

  const detected = detectCredentialFormat(parsed);
  if (!detected || !detected.payload) {
    throw new Error(
      'The file is valid JSON but does not contain a supported OAuth credential structure. Expected "installed" or "web" application credentials.'
    );
  }

  const { payload } = detected;

  // Validate required fields
  const missingFields = [];
  if (!payload.client_id || typeof payload.client_id !== 'string' || !payload.client_id.trim()) {
    missingFields.push('client_id');
  }
  if (!payload.client_secret || typeof payload.client_secret !== 'string' || !payload.client_secret.trim()) {
    missingFields.push('client_secret');
  }

  const authUrl = payload.auth_uri || payload.authorization_endpoint || payload.auth_url;
  if (!authUrl || typeof authUrl !== 'string' || !authUrl.trim()) {
    missingFields.push('auth_uri');
  }

  const tokenUrl = payload.token_uri || payload.token_endpoint || payload.token_url;
  if (!tokenUrl || typeof tokenUrl !== 'string' || !tokenUrl.trim()) {
    missingFields.push('token_uri');
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Invalid OAuth credentials file: Missing required field${
        missingFields.length > 1 ? 's' : ''
      }: ${missingFields.join(', ')}.`
    );
  }

  // Normalize redirect URIs safely
  let redirectUris = [];
  if (Array.isArray(payload.redirect_uris)) {
    redirectUris = payload.redirect_uris
      .filter((u) => typeof u === 'string' && u.trim().length > 0)
      .map((u) => u.trim());
  }

  const primaryRedirectUri = redirectUris.length > 0 ? redirectUris[0] : '';

  return {
    format: detected.format,
    appType: detected.appType,
    clientId: payload.client_id.trim(),
    clientSecret: payload.client_secret.trim(),
    authorizationUrl: authUrl.trim(),
    tokenUrl: tokenUrl.trim(),
    redirectUris,
    primaryRedirectUri,
    maskedSecret: '••••••••••',
  };
}
