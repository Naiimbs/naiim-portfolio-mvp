import { createDraft } from '../gmailClient.js';

/**
 * gmail_create_draft Tool Definition and Handler
 */
export const createDraftToolDefinition = {
  name: 'gmail_create_draft',
  description: 'Create a draft email in the user Gmail Drafts folder. Does NOT send the email. Sending requires explicit user confirmation.',
  inputSchema: {
    type: 'object',
    properties: {
      to: {
        description: 'Recipient email address or array of recipient addresses.',
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
        ],
      },
      subject: {
        type: 'string',
        description: 'Email subject line.',
      },
      body: {
        type: 'string',
        description: 'Plain text or HTML email body content.',
      },
      cc: {
        description: 'Optional CC email address or array of CC addresses.',
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
        ],
      },
      bcc: {
        description: 'Optional BCC email address or array of BCC addresses.',
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
        ],
      },
    },
    required: ['to', 'subject', 'body'],
  },
};

export async function handleCreateDraft(args = {}, customClient = null) {
  if (!args || typeof args !== 'object') {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Arguments must be provided as an object.' }],
      isError: true,
    };
  }

  const { to, subject, body, cc, bcc } = args;

  if (!to || (typeof to !== 'string' && !Array.isArray(to)) || (typeof to === 'string' && !to.trim())) {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Missing or invalid required parameter: to.' }],
      isError: true,
    };
  }
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Missing required parameter: subject (string).' }],
      isError: true,
    };
  }
  if (body === undefined || body === null || typeof body !== 'string') {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Missing required parameter: body (string).' }],
      isError: true,
    };
  }

  try {
    const result = await createDraft({ to, subject, body, cc, bcc }, customClient);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    const code = err.code || 'GMAIL_API_ERROR';
    return {
      content: [
        {
          type: 'text',
          text: `Error (${code}): ${err.message}`,
        },
      ],
      isError: true,
    };
  }
}
