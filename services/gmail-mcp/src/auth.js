import crypto from 'node:crypto';

/**
 * Validates MCP Bearer token from the HTTP Authorization header.
 *
 * Requirements:
 * - Requires Authorization: Bearer <GMAIL_MCP_ACCESS_TOKEN>
 * - Constant-time comparison to prevent timing attacks
 * - Returns structured error object if unauthorized or unconfigured
 * - Never logs or exposes token values
 */
export function validateMcpAuth(req) {
  const expectedToken = (process.env.GMAIL_MCP_ACCESS_TOKEN || '').trim();

  if (!expectedToken) {
    return {
      authenticated: false,
      statusCode: 503,
      error: {
        code: 'MCP_CONFIG_ERROR',
        message: 'GMAIL_MCP_ACCESS_TOKEN is not configured on the Gmail MCP server.',
      },
    };
  }

  const authHeader = req.headers['authorization'] || '';
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      statusCode: 401,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header. Expected Bearer token.',
      },
    };
  }

  const clientToken = authHeader.slice(7).trim();

  // Timing-safe comparison
  const expectedBuf = Buffer.from(expectedToken);
  const clientBuf = Buffer.from(clientToken);

  if (expectedBuf.length !== clientBuf.length || !crypto.timingSafeEqual(expectedBuf, clientBuf)) {
    return {
      authenticated: false,
      statusCode: 401,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid MCP credentials.',
      },
    };
  }

  return { authenticated: true };
}

/**
 * Checks presence of Google Cloud OAuth configuration without exposing values.
 */
export function getOAuthConfigStatus() {
  return {
    hasClientId: Boolean(process.env.GMAIL_CLIENT_ID),
    hasClientSecret: Boolean(process.env.GMAIL_CLIENT_SECRET),
    hasRefreshToken: Boolean(process.env.GMAIL_REFRESH_TOKEN),
  };
}
