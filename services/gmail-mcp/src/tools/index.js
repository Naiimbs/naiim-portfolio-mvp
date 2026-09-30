import { searchToolDefinition, handleSearch } from './search.js';
import { getMessageToolDefinition, handleGetMessage } from './getMessage.js';
import { getThreadToolDefinition, handleGetThread } from './getThread.js';
import { createDraftToolDefinition, handleCreateDraft } from './createDraft.js';

export const TOOLS_DEFINITIONS = [
  searchToolDefinition,
  getMessageToolDefinition,
  getThreadToolDefinition,
  createDraftToolDefinition,
];

const TOOL_HANDLERS = {
  gmail_search: handleSearch,
  gmail_get_message: handleGetMessage,
  gmail_get_thread: handleGetThread,
  gmail_create_draft: handleCreateDraft,
};

/**
 * Dispatches an MCP tools/call request to the corresponding tool handler.
 */
export async function executeTool(name, args = {}, customClient = null) {
  const handler = TOOL_HANDLERS[name];
  if (!handler) {
    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool "${name}".`,
        },
      ],
      isError: true,
    };
  }

  return await handler(args, customClient);
}
