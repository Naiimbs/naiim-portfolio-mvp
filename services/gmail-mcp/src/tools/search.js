import { searchMessages } from '../gmailClient.js';

/**
 * gmail_search Tool Definition and Handler
 */
export const searchToolDefinition = {
  name: 'gmail_search',
  description: "Search user's Gmail messages using standard Gmail query syntax (e.g. 'from:example@test.com', 'is:unread', 'subject:invoice'). Returns matching message metadata.",
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: "Gmail search query string (e.g. 'is:unread', 'from:alice@example.com')",
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of messages to return (default: 10, max: 50)',
      },
      max_results: {
        type: 'number',
        description: 'Alias for maxResults (default: 10, max: 50)',
      },
    },
    required: ['query'],
  },
};

export async function handleSearch(args = {}, customClient = null) {
  if (!args || typeof args !== 'object') {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Arguments must be provided as an object.' }],
      isError: true,
    };
  }

  const query = args.query;
  const maxResults = args.maxResults !== undefined ? args.maxResults : args.max_results;

  if (typeof query !== 'string' || !query.trim()) {
    return {
      content: [{ type: 'text', text: 'Error (GMAIL_INVALID_ARGUMENT): Missing required parameter: query (string).' }],
      isError: true,
    };
  }

  try {
    const result = await searchMessages({ query, maxResults }, customClient);
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
