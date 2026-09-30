import { base64UrlDecode } from './mime.js';

/**
 * Extracts standard email headers into a normalized key-value object.
 */
export function extractHeaders(payload = {}) {
  const headers = payload.headers || [];
  const result = {
    subject: '',
    from: '',
    to: '',
    date: '',
  };

  for (const h of headers) {
    const name = (h.name || '').toLowerCase();
    if (name === 'subject') result.subject = h.value || '';
    else if (name === 'from') result.from = h.value || '';
    else if (name === 'to') result.to = h.value || '';
    else if (name === 'date') result.date = h.value || '';
  }

  return result;
}

/**
 * Recursively extracts readable text content from MIME payload parts.
 * Prefers text/plain over text/html. Never downloads attachments.
 */
export function extractBody(payload = {}) {
  if (!payload) return '';

  let plainText = '';
  let htmlText = '';

  function walk(part) {
    if (!part) return;

    const mimeType = (part.mimeType || '').toLowerCase();
    const data = part.body?.data;

    // Handle plain text or implicit plain text body
    if ((!mimeType || mimeType === 'text/plain') && data && !plainText) {
      plainText = base64UrlDecode(data);
    } else if (mimeType === 'text/html' && data && !htmlText) {
      htmlText = base64UrlDecode(data);
    }

    if (Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        walk(subPart);
      }
    }
  }

  walk(payload);

  if (plainText) {
    return plainText.trim();
  }

  if (htmlText) {
    // Strip HTML tags and scripts into clean readable plain text
    return htmlText
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/p>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  }

  return '';
}

/**
 * Normalizes a raw Gmail API message resource into a concise, safe structure.
 */
export function normalizeMessage(msg = {}) {
  const headers = extractHeaders(msg.payload);
  const body = extractBody(msg.payload);

  return {
    id: msg.id || '',
    threadId: msg.threadId || '',
    labelIds: msg.labelIds || [],
    internalDate: msg.internalDate || '',
    headers,
    snippet: msg.snippet || '',
    body,
  };
}
