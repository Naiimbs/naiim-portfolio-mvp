import { getMessage } from '../gmailClient.js';

/**
 * gmail_get_message Tool Definition and Handler
 */
export const getMessageToolDefinition = {
  name: 'gmail_get_message',
  description: 'Retrieve email message details (sender, recipient, subject, snippet, and body) by message ID.',
  inputSchema: {
    type: 'object',
    properties: {
      messageId: {
        type: 'string',
        description: 'The unique ID of the Gmail message to retrieve.',
      },
      message_id: {
        type: 'string',
        description: 'Alias for messageId.',
      },
    },
    required: ['messageId'],
  },
};

export async function handleGetMessage(args = {}, customClient = null) {
  if (!args || typeof args !== 'object') {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Arguments must be provided as an object.' }],
      isError: true,
    };
  }

  const messageId = args.messageId || args.message_id;

  if (typeof messageId !== 'string' || !messageId.trim()) {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Missing required parameter: messageId (string).' }],
      isError: true,
    };
  }

  try {
    const result = await getMessage({ messageId: messageId.trim() }, customClient);
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
