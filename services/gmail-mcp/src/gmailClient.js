import { google } from 'googleapis';
import { getOAuth2Client, GmailAuthError } from './googleAuth.js';
import { buildRfc2822Raw } from './utils/mime.js';
import { extractHeaders, normalizeMessage } from './utils/parser.js';

export class GmailApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GmailApiError';
    this.code = code;
  }
}

/**
 * Returns an authenticated Gmail API v1 client instance.
 * Supports passing a mock client or custom auth instance for testing.
 */
export function getGmailClient(customAuth = null) {
  const auth = customAuth || getOAuth2Client();
  return google.gmail({ version: 'v1', auth });
}

/**
 * Maps Google API exceptions to clean, safe MCP domain errors without leaking internal data.
 */
export function handleGmailApiError(err) {
  if (err instanceof GmailAuthError || err instanceof GmailApiError) {
    return err;
  }

  const status = err.status || err.code;
  const msg = (err.message || '').toLowerCase();

  if (status === 401 || msg.includes('invalid_grant') || msg.includes('unauthorized')) {
    return new GmailApiError('GMAIL_OAUTH_FAILED', 'Gmail authentication failed. Please verify OAuth refresh credentials.');
  }

  if (status === 403 || msg.includes('insufficient authentication scopes') || msg.includes('permission')) {
    return new GmailApiError('GMAIL_PERMISSION_DENIED', 'Permission denied. Ensure the refresh token has gmail.readonly and gmail.compose scopes.');
  }

  if (status === 404 || msg.includes('not found')) {
    return new GmailApiError('GMAIL_NOT_FOUND', 'The requested email message or thread was not found.');
  }

  if (status === 429 || msg.includes('quota') || msg.includes('rate limit')) {
    return new GmailApiError('GMAIL_RATE_LIMITED', 'Gmail API rate limit exceeded. Please try again shortly.');
  }

  if (status === 400 || msg.includes('invalid argument') || msg.includes('bad request')) {
    return new GmailApiError('GMAIL_INVALID_ARGUMENT', err.message || 'Invalid argument passed to Gmail API.');
  }

  if (status >= 500 || msg.includes('backend error') || msg.includes('unavailable')) {
    return new GmailApiError('GMAIL_API_UNAVAILABLE', 'Gmail API service is currently unavailable. Please try again later.');
  }

  return new GmailApiError('GMAIL_API_ERROR', 'A Gmail API operation error occurred.');
}

/**
 * Validates connectivity with the authenticated user's Gmail account.
 */
export async function checkGmailConnection(customGmail = null) {
  try {
    const gmail = customGmail || getGmailClient();
    const res = await gmail.users.getProfile({ userId: 'me' });
    return {
      ok: true,
      emailAddress: res.data?.emailAddress || undefined,
      messagesTotal: res.data?.messagesTotal,
    };
  } catch (err) {
    throw handleGmailApiError(err);
  }
}

/**
 * Searches messages using Gmail query syntax. Returns structured metadata for matching items.
 */
export async function searchMessages({ query, maxResults = 10 }, customGmail = null) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new GmailApiError('GMAIL_INVALID_ARGUMENT', 'Search query is required.');
  }

  const boundedMax = Math.min(Math.max(parseInt(maxResults, 10) || 10, 1), 50);

  try {
    const gmail = customGmail || getGmailClient();
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query.trim(),
      maxResults: boundedMax,
    });

    const items = listRes.data.messages || [];
    if (items.length === 0) {
      return {
        messages: [],
        resultSizeEstimate: listRes.data.resultSizeEstimate || 0,
      };
    }

    // Retrieve lightweight metadata for found message IDs in parallel
    const metadataPromises = items.map(async (item) => {
      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: item.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'To', 'Date'],
        });
        const headers = extractHeaders(msgRes.data.payload);
        return {
          id: msgRes.data.id || item.id,
          threadId: msgRes.data.threadId || item.threadId,
          subject: headers.subject,
          from: headers.from,
          to: headers.to,
          date: headers.date,
          snippet: msgRes.data.snippet || '',
        };
      } catch {
        return {
          id: item.id,
          threadId: item.threadId,
          subject: '',
          from: '',
          to: '',
          date: '',
          snippet: '',
        };
      }
    });

    const messages = await Promise.all(metadataPromises);

    return {
      messages,
      resultSizeEstimate: listRes.data.resultSizeEstimate || messages.length,
    };
  } catch (err) {
    throw handleGmailApiError(err);
  }
}

/**
 * Retrieves a single normalized message by ID.
 */
export async function getMessage({ messageId }, customGmail = null) {
  if (!messageId || typeof messageId !== 'string' || !messageId.trim()) {
    throw new GmailApiError('GMAIL_INVALID_ARGUMENT', 'Parameter "messageId" is required.');
  }

  try {
    const gmail = customGmail || getGmailClient();
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId.trim(),
      format: 'full',
    });

    return normalizeMessage(res.data);
  } catch (err) {
    throw handleGmailApiError(err);
  }
}

/**
 * Retrieves an entire email conversation thread by thread ID.
 */
export async function getThread({ threadId }, customGmail = null) {
  if (!threadId || typeof threadId !== 'string' || !threadId.trim()) {
    throw new GmailApiError('GMAIL_INVALID_ARGUMENT', 'Parameter "threadId" is required.');
  }

  try {
    const gmail = customGmail || getGmailClient();
    const res = await gmail.users.threads.get({
      userId: 'me',
      id: threadId.trim(),
      format: 'full',
    });

    const rawMessages = res.data.messages || [];
    const normalizedMessages = rawMessages.map((m) => normalizeMessage(m));

    return {
      id: res.data.id || threadId.trim(),
      messages: normalizedMessages,
    };
  } catch (err) {
    throw handleGmailApiError(err);
  }
}

/**
 * Creates a draft email in the user's Gmail Drafts folder.
 * NOTE: This function ONLY creates drafts. There is NO send operation.
 */
export async function createDraft({ to, subject, body, cc, bcc }, customGmail = null) {
  if (!to || (!Array.isArray(to) && typeof to !== 'string')) {
    throw new GmailApiError('GMAIL_INVALID_ARGUMENT', 'Parameter "to" is required (string or array of email addresses).');
  }
  if (!subject || typeof subject !== 'string') {
    throw new GmailApiError('GMAIL_INVALID_ARGUMENT', 'Parameter "subject" is required.');
  }
  if (body === undefined || body === null || typeof body !== 'string') {
    throw new GmailApiError('GMAIL_INVALID_ARGUMENT', 'Parameter "body" is required.');
  }

  try {
    const gmail = customGmail || getGmailClient();
    const raw = buildRfc2822Raw({ to, subject, body, cc, bcc });

    const res = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw,
        },
      },
    });

    return {
      draftId: res.data.id || '',
      messageId: res.data.message?.id || '',
      threadId: res.data.message?.threadId || '',
    };
  } catch (err) {
    throw handleGmailApiError(err);
  }
}
