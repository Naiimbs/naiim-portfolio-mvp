import { TOOLS_DEFINITIONS, executeTool } from './tools/index.js';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = {
  name: 'gmail-mcp',
  version: '0.1.0',
};

/**
 * Handles an incoming MCP JSON-RPC 2.0 payload.
 *
 * @param {object} rpc - Parsed JSON-RPC request object
 * @returns {Promise<{ statusCode: number, body: object }>}
 */
export async function handleMcpJsonRpc(rpc) {
  if (!rpc || typeof rpc !== 'object' || Array.isArray(rpc)) {
    return {
      statusCode: 400,
      body: {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid Request: expected a JSON-RPC 2.0 object.' },
      },
    };
  }

  const { jsonrpc, id, method, params } = rpc;

  // Validate JSON-RPC 2.0 protocol header if provided
  if (jsonrpc && jsonrpc !== '2.0') {
    return {
      statusCode: 400,
      body: {
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid JSON-RPC protocol version. Expected "2.0".' },
      },
    };
  }

  // 1. initialize Handshake
  if (method === 'initialize') {
    return {
      statusCode: 200,
      body: {
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
          capabilities: {
            tools: {},
          },
        },
      },
    };
  }

  // 2. notifications/initialized (notification - client signals it is ready)
  if (method === 'notifications/initialized') {
    return {
      statusCode: 200,
      body: { ok: true },
    };
  }

  // 3. tools/list Discovery
  if (method === 'tools/list') {
    return {
      statusCode: 200,
      body: {
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          tools: TOOLS_DEFINITIONS,
        },
      },
    };
  }

  // 4. tools/call Execution
  if (method === 'tools/call') {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};

    if (!toolName || typeof toolName !== 'string') {
      return {
        statusCode: 200,
        body: {
          jsonrpc: '2.0',
          id: id ?? null,
          result: {
            content: [{ type: 'text', text: 'Invalid tools/call: missing parameter "name".' }],
            isError: true,
          },
        },
      };
    }

    const toolResult = await executeTool(toolName, toolArgs);

    return {
      statusCode: 200,
      body: {
        jsonrpc: '2.0',
        id: id ?? null,
        result: toolResult,
      },
    };
  }

  // 5. Unknown Method Handler
  return {
    statusCode: 200,
    body: {
      jsonrpc: '2.0',
      id: id ?? null,
      error: {
        code: -32601,
        message: `Method "${method}" not found. Supported methods: initialize, notifications/initialized, tools/list, tools/call.`,
      },
    },
  };
}
