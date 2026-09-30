import { getThread } from '../gmailClient.js';

/**
 * gmail_get_thread Tool Definition and Handler
 */
export const getThreadToolDefinition = {
  name: 'gmail_get_thread',
  description: 'Retrieve an entire email conversation thread by thread ID, returning all messages in the thread in chronological order.',
  inputSchema: {
    type: 'object',
    properties: {
      threadId: {
        type: 'string',
        description: 'The unique ID of the Gmail conversation thread to retrieve.',
      },
      thread_id: {
        type: 'string',
        description: 'Alias for threadId.',
      },
    },
    required: ['threadId'],
  },
};

export async function handleGetThread(args = {}, customClient = null) {
  if (!args || typeof args !== 'object') {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Arguments must be provided as an object.' }],
      isError: true,
    };
  }

  const threadId = args.threadId || args.thread_id;

  if (typeof threadId !== 'string' || !threadId.trim()) {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Missing required parameter: threadId (string).' }],
      isError: true,
    };
  }

  try {
    const result = await getThread({ threadId: threadId.trim() }, customClient);
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
