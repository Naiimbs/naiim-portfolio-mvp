/**
 * Encodes a buffer or string into URL-safe base64 (RFC 4648 § 5) as required by Gmail API.
 */
export function base64UrlEncode(str) {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes URL-safe base64 string from Gmail API message parts.
 */
export function base64UrlDecode(str) {
  if (!str) return '';
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Builds an RFC 2822 formatted email message string and returns its base64url representation.
 *
 * @param {object} params
 * @param {string|string[]} params.to - Recipient email(s)
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email plain text or HTML content
 * @param {string|string[]} [params.cc] - Optional CC email(s)
 * @param {string|string[]} [params.bcc] - Optional BCC email(s)
 * @returns {string} base64url encoded raw RFC 2822 email
 */
export function buildRfc2822Raw({ to, subject, body, cc, bcc }) {
  const toHeader = Array.isArray(to) ? to.join(', ') : to;
  const lines = [
    `To: ${toHeader}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject || '', 'utf-8').toString('base64')}?=`,
    'MIME-Version: 1.0',
  ];

  if (cc) {
    const ccHeader = Array.isArray(cc) ? cc.join(', ') : cc;
    if (ccHeader) lines.push(`Cc: ${ccHeader}`);
  }

  if (bcc) {
    const bccHeader = Array.isArray(bcc) ? bcc.join(', ') : bcc;
    if (bccHeader) lines.push(`Bcc: ${bccHeader}`);
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(body);
  if (isHtml) {
    lines.push('Content-Type: text/html; charset=UTF-8');
  } else {
    lines.push('Content-Type: text/plain; charset=UTF-8');
  }
  lines.push('Content-Transfer-Encoding: 8bit');
  lines.push(''); // Blank line separates headers from body
  lines.push(body || '');

  const rawMessage = lines.join('\r\n');
  return base64UrlEncode(rawMessage);
}
