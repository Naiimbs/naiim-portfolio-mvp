import crypto from 'node:crypto';

// In-memory state store: Map<string, { createdAt: number, expiresAt: number }>
const stateStore = new Map();

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Prunes expired state tokens from the in-memory store.
 */
function pruneExpiredStates() {
  const now = Date.now();
  for (const [state, entry] of stateStore.entries()) {
    if (now > entry.expiresAt) {
      stateStore.delete(state);
    }
  }
}

/**
 * Generates a cryptographically secure random state token with short expiration.
 *
 * @param {number} [ttlMs=DEFAULT_TTL_MS]
 * @returns {string} 64-character hex state token
 */
export function createOAuthState(ttlMs = DEFAULT_TTL_MS) {
  pruneExpiredStates();

  const state = crypto.randomBytes(32).toString('hex');
  const now = Date.now();

  stateStore.set(state, {
    createdAt: now,
    expiresAt: now + ttlMs,
  });

  return state;
}

/**
 * Validates and immediately consumes an OAuth state token (one-time use).
 *
 * @param {string} state - The state string from OAuth callback
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateAndConsumeOAuthState(state) {
  if (!state || typeof state !== 'string' || !state.trim()) {
    return { valid: false, error: 'MISSING_STATE' };
  }

  const trimmedState = state.trim();
  const entry = stateStore.get(trimmedState);

  // Enforce one-time use immediately
  if (entry) {
    stateStore.delete(trimmedState);
  }

  // Prune other pending states
  pruneExpiredStates();

  if (!entry) {
    return { valid: false, error: 'INVALID_OR_REPLAYED_STATE' };
  }

  if (Date.now() > entry.expiresAt) {
    return { valid: false, error: 'EXPIRED_STATE' };
  }

  return { valid: true };
}

/**
 * Clears all pending OAuth states (primarily used in automated test teardown).
 */
export function resetOAuthStates() {
  stateStore.clear();
}
