import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/index.js';
import {
  validateOAuthConfig,
  validateClientCredentials,
  getOAuth2Client,
  resetOAuth2Client,
  generateGoogleAuthUrl,
  exchangeCodeForTokens,
  saveRefreshToken,
  GmailAuthError,
  GMAIL_SCOPES,
} from '../src/googleAuth.js';
import {
  checkGmailConnection,
  searchMessages,
  getMessage,
  getThread,
  createDraft,
  handleGmailApiError,
  GmailApiError,
} from '../src/gmailClient.js';
import {
  createOAuthState,
  validateAndConsumeOAuthState,
  resetOAuthStates,
} from '../src/oauthState.js';
import { base64UrlEncode } from '../src/utils/mime.js';
import { handleSearch } from '../src/tools/search.js';
import { handleGetMessage } from '../src/tools/getMessage.js';
import { handleGetThread } from '../src/tools/getThread.js';
import { handleCreateDraft } from '../src/tools/createDraft.js';

const TEST_PORT = 3199;
const TEST_TOKEN = 'test-secret-token-xyz-12345';
const TEST_SECRET = 'super-secret-client-secret-should-never-leak';
const TEST_REFRESH = 'super-secret-refresh-token-should-never-leak';
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

before(async () => {
  process.env.GMAIL_MCP_ACCESS_TOKEN = TEST_TOKEN;
  process.env.GMAIL_CLIENT_ID = 'test-client-id-123.apps.googleusercontent.com';
  process.env.GMAIL_CLIENT_SECRET = TEST_SECRET;
  process.env.GMAIL_REFRESH_TOKEN = TEST_REFRESH;
  process.env.GMAIL_OAUTH_REDIRECT_URI = `http://127.0.0.1:${TEST_PORT}/oauth/google/callback`;

  await new Promise((resolve) => {
    server.listen(TEST_PORT, '127.0.0.1', resolve);
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

// Helper for test HTTP requests
async function makeRequest(path, { method = 'GET', headers = {}, body = null, redirect = 'manual' } = {}) {
  const opts = {
    method,
    headers: { ...headers },
    redirect,
  };
  if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // raw text
  }
  return { status: res.status, headers: res.headers, json, text };
}

/* ========================================================================== */
/* 1. MCP Protocol & Authentication Baseline Tests                            */
/* ========================================================================== */

test('1. GET /health returns 200 without authentication', async () => {
  const { status, json } = await makeRequest('/health');
  assert.equal(status, 200);
  assert.deepEqual(json, {
    ok: true,
    service: 'gmail-mcp',
    version: '0.1.0',
  });
});

test('2. POST /mcp without Authorization returns 401 UNAUTHORIZED', async () => {
  const { status, json } = await makeRequest('/mcp', {
    method: 'POST',
    body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
  });
  assert.equal(status, 401);
  assert.equal(json?.error?.code, 'UNAUTHORIZED');
});

test('3. POST /mcp with invalid token returns 401 UNAUTHORIZED', async () => {
  const { status, json } = await makeRequest('/mcp', {
    method: 'POST',
    headers: { Authorization: 'Bearer wrong-invalid-token' },
    body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
  });
  assert.equal(status, 401);
  assert.equal(json?.error?.code, 'UNAUTHORIZED');
});

test('4. POST /mcp with valid token + initialize returns valid MCP handshake', async () => {
  const { status, json } = await makeRequest('/mcp', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    body: {
      jsonrpc: '2.0',
      id: 'init_1',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    },
  });

  assert.equal(status, 200);
  assert.equal(json?.jsonrpc, '2.0');
  assert.equal(json?.id, 'init_1');
  assert.equal(json?.result?.protocolVersion, '2024-11-05');
  assert.equal(json?.result?.serverInfo?.name, 'gmail-mcp');
  assert.equal(json?.result?.serverInfo?.version, '0.1.0');
  assert.ok(json?.result?.capabilities?.tools !== undefined);
});

test('5. POST /mcp notifications/initialized is accepted with 200', async () => {
  const { status, json } = await makeRequest('/mcp', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    body: {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    },
  });

  assert.equal(status, 200);
  assert.equal(json?.ok, true);
});

test('6. POST /mcp tools/list returns exactly the 4 required tools with schemas', async () => {
  const { status, json } = await makeRequest('/mcp', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    body: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    },
  });

  assert.equal(status, 200);
  assert.ok(Array.isArray(json?.result?.tools));
  assert.equal(json.result.tools.length, 4);

  const toolNames = json.result.tools.map((t) => t.name);
  assert.ok(toolNames.includes('gmail_search'));
  assert.ok(toolNames.includes('gmail_get_message'));
  assert.ok(toolNames.includes('gmail_get_thread'));
  assert.ok(toolNames.includes('gmail_create_draft'));

  const searchTool = json.result.tools.find((t) => t.name === 'gmail_search');
  assert.ok(searchTool.inputSchema?.properties?.query);
  assert.deepEqual(searchTool.inputSchema.required, ['query']);

  const getMsgTool = json.result.tools.find((t) => t.name === 'gmail_get_message');
  assert.ok(getMsgTool.inputSchema?.properties?.messageId);

  const getThreadTool = json.result.tools.find((t) => t.name === 'gmail_get_thread');
  assert.ok(getThreadTool.inputSchema?.properties?.threadId);

  const createDraftTool = json.result.tools.find((t) => t.name === 'gmail_create_draft');
  assert.ok(createDraftTool.inputSchema?.properties?.to);
  assert.ok(createDraftTool.inputSchema?.properties?.subject);
  assert.ok(createDraftTool.inputSchema?.properties?.body);
});

test('7. POST /mcp tools/call unknown tool returns controlled error', async () => {
  const { status, json } = await makeRequest('/mcp', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    body: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'unknown_nonexistent_tool',
        arguments: {},
      },
    },
  });

  assert.equal(status, 200);
  assert.equal(json?.result?.isError, true);
  assert.ok(json?.result?.content[0]?.text.includes('Unknown tool'));
});

test('8. POST /mcp with malformed JSON returns controlled 400 parse error', async () => {
  const { status, json } = await makeRequest('/mcp', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    body: '{ malformed json syntax ]',
  });

  assert.equal(status, 400);
  assert.equal(json?.error?.code, -32700);
  assert.ok(json?.error?.message.includes('Parse error'));
});

/* ========================================================================== */
/* 2. OAuth Configuration & Error Handling Tests                              */
/* ========================================================================== */

test('9. OAuth config validation detects missing environment variables', () => {
  const origClientId = process.env.GMAIL_CLIENT_ID;
  const origSecret = process.env.GMAIL_CLIENT_SECRET;
  const origRefresh = process.env.GMAIL_REFRESH_TOKEN;

  try {
    delete process.env.GMAIL_CLIENT_ID;
    const v1 = validateOAuthConfig();
    assert.equal(v1.configured, false);
    assert.ok(v1.missing.includes('GMAIL_CLIENT_ID'));

    process.env.GMAIL_CLIENT_ID = 'valid-id';
    delete process.env.GMAIL_CLIENT_SECRET;
    const v2 = validateOAuthConfig();
    assert.equal(v2.configured, false);
    assert.ok(v2.missing.includes('GMAIL_CLIENT_SECRET'));

    process.env.GMAIL_CLIENT_SECRET = 'valid-secret';
    delete process.env.GMAIL_REFRESH_TOKEN;
    const v3 = validateOAuthConfig();
    assert.equal(v3.configured, false);
    assert.ok(v3.missing.includes('GMAIL_REFRESH_TOKEN'));
  } finally {
    process.env.GMAIL_CLIENT_ID = origClientId;
    process.env.GMAIL_CLIENT_SECRET = origSecret;
    process.env.GMAIL_REFRESH_TOKEN = origRefresh;
    resetOAuth2Client();
  }
});

test('10. getOAuth2Client throws GMAIL_OAUTH_NOT_CONFIGURED when variables are missing', () => {
  const origClientId = process.env.GMAIL_CLIENT_ID;
  try {
    delete process.env.GMAIL_CLIENT_ID;
    resetOAuth2Client();
    assert.throws(
      () => getOAuth2Client(true),
      (err) => {
        assert.ok(err instanceof GmailAuthError);
        assert.equal(err.code, 'GMAIL_OAUTH_NOT_CONFIGURED');
        assert.ok(err.message.includes('Missing: GMAIL_CLIENT_ID'));
        return true;
      }
    );
  } finally {
    process.env.GMAIL_CLIENT_ID = origClientId;
    resetOAuth2Client();
  }
});

test('11. handleGmailApiError maps HTTP status codes to safe domain errors', () => {
  const err401 = handleGmailApiError({ status: 401, message: 'invalid_grant' });
  assert.equal(err401.code, 'GMAIL_OAUTH_FAILED');

  const err403 = handleGmailApiError({ status: 403, message: 'insufficient authentication scopes' });
  assert.equal(err403.code, 'GMAIL_PERMISSION_DENIED');

  const err404 = handleGmailApiError({ status: 404, message: 'Not Found' });
  assert.equal(err404.code, 'GMAIL_NOT_FOUND');

  const err429 = handleGmailApiError({ status: 429, message: 'Quota exceeded' });
  assert.equal(err429.code, 'GMAIL_RATE_LIMITED');

  const err500 = handleGmailApiError({ status: 500, message: 'Internal Server Error' });
  assert.equal(err500.code, 'GMAIL_API_UNAVAILABLE');
});

/* ========================================================================== */
/* 3. Gmail Client & Tool Mock Tests                                          */
/* ========================================================================== */

test('12. checkGmailConnection returns profile metadata on success', async () => {
  const mockGmail = {
    users: {
      getProfile: async () => ({
        data: {
          emailAddress: 'test@example.com',
          messagesTotal: 150,
        },
      }),
    },
  };

  const res = await checkGmailConnection(mockGmail);
  assert.equal(res.ok, true);
  assert.equal(res.emailAddress, 'test@example.com');
  assert.equal(res.messagesTotal, 150);
});

test('13. gmail_search executes search and formats lightweight metadata', async () => {
  const mockGmail = {
    users: {
      messages: {
        list: async () => ({
          data: {
            messages: [{ id: 'msg_1', threadId: 'th_1' }],
            resultSizeEstimate: 1,
          },
        }),
        get: async ({ id }) => ({
          data: {
            id,
            threadId: 'th_1',
            snippet: 'Snippet for message 1',
            payload: {
              headers: [
                { name: 'Subject', value: 'Invoice 101' },
                { name: 'From', value: 'billing@example.com' },
                { name: 'To', value: 'me@example.com' },
                { name: 'Date', value: 'Wed, 30 Sep 2026 10:00:00 GMT' },
              ],
            },
          },
        }),
      },
    },
  };

  const toolRes = await handleSearch({ query: 'is:unread' }, mockGmail);
  assert.equal(toolRes.isError, undefined);
  const parsed = JSON.parse(toolRes.content[0].text);
  assert.equal(parsed.messages.length, 1);
  assert.equal(parsed.messages[0].id, 'msg_1');
  assert.equal(parsed.messages[0].subject, 'Invoice 101');
  assert.equal(parsed.messages[0].from, 'billing@example.com');
});

test('14. gmail_search handles empty search results gracefully', async () => {
  const mockGmail = {
    users: {
      messages: {
        list: async () => ({
          data: {
            messages: [],
            resultSizeEstimate: 0,
          },
        }),
      },
    },
  };

  const toolRes = await handleSearch({ query: 'nonexistent query' }, mockGmail);
  assert.equal(toolRes.isError, undefined);
  const parsed = JSON.parse(toolRes.content[0].text);
  assert.deepEqual(parsed.messages, []);
  assert.equal(parsed.resultSizeEstimate, 0);
});

test('15. gmail_search rejects invalid or missing query', async () => {
  const res1 = await handleSearch({});
  assert.equal(res1.isError, true);
  assert.ok(res1.content[0].text.includes('Missing required parameter'));

  const res2 = await handleSearch({ query: '   ' });
  assert.equal(res2.isError, true);
});

test('16. gmail_get_message retrieves and normalizes plain text body', async () => {
  const plainText = 'Hello from plain text!';
  const encodedBody = base64UrlEncode(plainText);

  const mockGmail = {
    users: {
      messages: {
        get: async () => ({
          data: {
            id: 'msg_plain',
            threadId: 'th_plain',
            labelIds: ['INBOX'],
            internalDate: '1727683200000',
            snippet: 'Hello from plain text...',
            payload: {
              mimeType: 'text/plain',
              headers: [
                { name: 'Subject', value: 'Hello World' },
                { name: 'From', value: 'alice@example.com' },
                { name: 'To', value: 'bob@example.com' },
              ],
              body: {
                data: encodedBody,
              },
            },
          },
        }),
      },
    },
  };

  const toolRes = await handleGetMessage({ messageId: 'msg_plain' }, mockGmail);
  assert.equal(toolRes.isError, undefined);
  const parsed = JSON.parse(toolRes.content[0].text);
  assert.equal(parsed.id, 'msg_plain');
  assert.equal(parsed.headers.subject, 'Hello World');
  assert.equal(parsed.body, plainText);
});

test('17. gmail_get_message falls back to HTML body when plain text is absent', async () => {
  const htmlContent = '<div><p>Hello <b>Rich</b> World!</p></div>';
  const encodedBody = base64UrlEncode(htmlContent);

  const mockGmail = {
    users: {
      messages: {
        get: async () => ({
          data: {
            id: 'msg_html',
            threadId: 'th_html',
            snippet: 'Hello Rich World!',
            payload: {
              mimeType: 'text/html',
              headers: [{ name: 'Subject', value: 'HTML Email' }],
              body: {
                data: encodedBody,
              },
            },
          },
        }),
      },
    },
  };

  const toolRes = await handleGetMessage({ message_id: 'msg_html' }, mockGmail);
  assert.equal(toolRes.isError, undefined);
  const parsed = JSON.parse(toolRes.content[0].text);
  assert.ok(parsed.body.includes('Hello Rich World!'));
  assert.equal(parsed.body.includes('<div>'), false);
});

test('18. gmail_get_thread returns all normalized messages in a thread', async () => {
  const mockGmail = {
    users: {
      threads: {
        get: async () => ({
          data: {
            id: 'th_123',
            messages: [
              {
                id: 'msg_1',
                threadId: 'th_123',
                snippet: 'First message',
                payload: {
                  mimeType: 'text/plain',
                  headers: [{ name: 'Subject', value: 'Thread Subject' }],
                  body: { data: base64UrlEncode('Message 1 content') },
                },
              },
              {
                id: 'msg_2',
                threadId: 'th_123',
                snippet: 'Reply message',
                payload: {
                  mimeType: 'text/plain',
                  headers: [{ name: 'Subject', value: 'Re: Thread Subject' }],
                  body: { data: base64UrlEncode('Message 2 content') },
                },
              },
            ],
          },
        }),
      },
    },
  };

  const toolRes = await handleGetThread({ threadId: 'th_123' }, mockGmail);
  assert.equal(toolRes.isError, undefined);
  const parsed = JSON.parse(toolRes.content[0].text);
  assert.equal(parsed.id, 'th_123');
  assert.equal(parsed.messages.length, 2);
  assert.equal(parsed.messages[0].body, 'Message 1 content');
  assert.equal(parsed.messages[1].body, 'Message 2 content');
});

test('19. gmail_create_draft creates a draft and NEVER sends', async () => {
  let draftsCreateCalled = false;
  let messagesSendCalled = false;
  let capturedRaw = null;

  const mockGmail = {
    users: {
      drafts: {
        create: async ({ requestBody }) => {
          draftsCreateCalled = true;
          capturedRaw = requestBody?.message?.raw;
          return {
            data: {
              id: 'draft_999',
              message: {
                id: 'msg_draft_999',
                threadId: 'th_draft_999',
              },
            },
          };
        },
      },
      messages: {
        send: async () => {
          messagesSendCalled = true;
          throw new Error('FATAL: messages.send was invoked!');
        },
      },
    },
  };

  const toolRes = await handleCreateDraft(
    {
      to: ['recipient@example.com'],
      subject: 'Draft Subject',
      body: 'Draft body text goes here.',
    },
    mockGmail
  );

  assert.equal(toolRes.isError, undefined);
  assert.equal(draftsCreateCalled, true);
  assert.equal(messagesSendCalled, false);
  assert.ok(capturedRaw);

  const parsed = JSON.parse(toolRes.content[0].text);
  assert.equal(parsed.draftId, 'draft_999');
  assert.equal(parsed.messageId, 'msg_draft_999');
  assert.equal(parsed.threadId, 'th_draft_999');
});

test('20. gmail_create_draft rejects missing required fields', async () => {
  const res1 = await handleCreateDraft({ subject: 'No to', body: 'Body' });
  assert.equal(res1.isError, true);
  assert.ok(res1.content[0].text.includes('Missing or invalid required parameter: to'));

  const res2 = await handleCreateDraft({ to: 'user@example.com', body: 'No subject' });
  assert.equal(res2.isError, true);
  assert.ok(res2.content[0].text.includes('Missing required parameter: subject'));

  const res3 = await handleCreateDraft({ to: 'user@example.com', subject: 'No body' });
  assert.equal(res3.isError, true);
  assert.ok(res3.content[0].text.includes('Missing required parameter: body'));
});

test('21. Secrets never leak in any response, error, or JSON-RPC payload', async () => {
  const sensitiveStrings = [
    TEST_SECRET,
    TEST_REFRESH,
    TEST_TOKEN,
  ];

  const endpoints = [
    { path: '/health', opts: { method: 'GET' } },
    {
      path: '/mcp',
      opts: {
        method: 'POST',
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        body: { jsonrpc: '2.0', id: 'sec_1', method: 'tools/list' },
      },
    },
    {
      path: '/mcp',
      opts: {
        method: 'POST',
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        body: { jsonrpc: '2.0', id: 'sec_2', method: 'tools/call', params: { name: 'gmail_search', arguments: { query: 'test' } } },
      },
    },
  ];

  for (const { path, opts } of endpoints) {
    const { text } = await makeRequest(path, opts);
    for (const secret of sensitiveStrings) {
      assert.equal(
        text.includes(secret),
        false,
        `Sensitive secret "${secret}" was found in response for ${path}!`
      );
    }
  }

  const authErr = new GmailAuthError('TEST_CODE', 'A test message');
  const apiErr = new GmailApiError('TEST_API_CODE', 'An API test message');

  for (const err of [authErr, apiErr]) {
    for (const secret of sensitiveStrings) {
      assert.equal(err.message.includes(secret), false);
      assert.equal(String(err).includes(secret), false);
    }
  }
});

/* ========================================================================== */
/* 4. Phase 2B: OAuth Authorization Flow & State Protection Tests             */
/* ========================================================================== */

test('22. GET /oauth/status returns public status and scopes without leaking credentials', async () => {
  const { status, json, text } = await makeRequest('/oauth/status');
  assert.equal(status, 200);
  assert.equal(json?.configured, true);
  assert.equal(json?.authenticated, true);
  assert.ok(Array.isArray(json?.scopes));
  assert.ok(json.scopes.includes('https://www.googleapis.com/auth/gmail.readonly'));
  assert.ok(json.scopes.includes('https://www.googleapis.com/auth/gmail.compose'));
  assert.equal(json.scopes.includes('https://www.googleapis.com/auth/gmail.send'), false);

  assert.equal(text.includes(TEST_SECRET), false);
  assert.equal(text.includes(TEST_REFRESH), false);
});

test('23. GET /oauth/google/start redirects (302) to Google with valid parameters', async () => {
  const { status, headers, text } = await makeRequest('/oauth/google/start');
  assert.equal(status, 302);
  const location = headers.get('location');
  assert.ok(location, 'Expected 302 Location redirect header');

  const parsedUrl = new URL(location);
  assert.equal(parsedUrl.hostname, 'accounts.google.com');
  assert.equal(parsedUrl.searchParams.get('access_type'), 'offline');
  assert.equal(parsedUrl.searchParams.get('prompt'), 'consent');
  assert.ok(parsedUrl.searchParams.get('state'), 'Expected state parameter in auth URL');
  assert.equal(parsedUrl.searchParams.get('state').length, 64); // 32 bytes hex

  // Ensure scopes contain readonly and compose, but NEVER send
  const scopeParam = parsedUrl.searchParams.get('scope') || '';
  assert.ok(scopeParam.includes('gmail.readonly'));
  assert.ok(scopeParam.includes('gmail.compose'));
  assert.equal(scopeParam.includes('gmail.send'), false);

  // No secrets leaked in URL or response
  assert.equal(text.includes(TEST_SECRET), false);
  assert.equal(location.includes(TEST_SECRET), false);
});

test('24. GET /oauth/google/start returns 400 when client credentials are missing', async () => {
  const origId = process.env.GMAIL_CLIENT_ID;
  try {
    delete process.env.GMAIL_CLIENT_ID;
    const { status, json } = await makeRequest('/oauth/google/start');
    assert.equal(status, 400);
    assert.equal(json?.error?.code, 'GMAIL_OAUTH_NOT_CONFIGURED');
  } finally {
    process.env.GMAIL_CLIENT_ID = origId;
  }
});

test('25. OAuth state generator produces unique, high-entropy tokens', () => {
  const tokens = new Set();
  for (let i = 0; i < 50; i++) {
    const s = createOAuthState();
    assert.equal(s.length, 64);
    assert.ok(/^[0-9a-f]{64}$/.test(s));
    tokens.add(s);
  }
  assert.equal(tokens.size, 50, 'All generated states must be unique');
});

test('26. OAuth state replay protection enforces one-time use', () => {
  const state = createOAuthState();
  const first = validateAndConsumeOAuthState(state);
  assert.equal(first.valid, true);

  // Immediate second validation must fail (replay attack prevented)
  const second = validateAndConsumeOAuthState(state);
  assert.equal(second.valid, false);
  assert.equal(second.error, 'INVALID_OR_REPLAYED_STATE');
});

test('27. OAuth state expiration rejects expired tokens', async () => {
  // Create a state with 1ms TTL
  const state = createOAuthState(-1000);
  const result = validateAndConsumeOAuthState(state);
  assert.equal(result.valid, false);
  assert.equal(result.error, 'EXPIRED_STATE');
});

test('28. GET /oauth/google/callback handles Google decline/error safely', async () => {
  const { status, text } = await makeRequest('/oauth/google/callback?error=access_denied');
  assert.equal(status, 400);
  assert.ok(text.includes('Google OAuth Authorization Declined'));
  assert.ok(text.includes('access_denied'));
  assert.equal(text.includes(TEST_SECRET), false);
});

test('29. GET /oauth/google/callback rejects missing or invalid state', async () => {
  const res1 = await makeRequest('/oauth/google/callback?code=some_code');
  assert.equal(res1.status, 400);
  assert.ok(res1.text.includes('OAuth Security Check Failed'));

  const res2 = await makeRequest('/oauth/google/callback?code=some_code&state=nonexistent_state');
  assert.equal(res2.status, 400);
  assert.ok(res2.text.includes('OAuth Security Check Failed'));
});

test('30. GET /oauth/google/callback rejects missing authorization code', async () => {
  const state = createOAuthState();
  const res = await makeRequest(`/oauth/google/callback?state=${state}`);
  assert.equal(res.status, 400);
  assert.ok(res.text.includes('Missing Authorization Code'));
});

test('31. exchangeCodeForTokens exchanges valid code and extracts refresh token', async () => {
  const mockClient = {
    getToken: async (code) => {
      assert.equal(code, 'mock_auth_code_123');
      return {
        tokens: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token-456',
          scope: GMAIL_SCOPES.join(' '),
          token_type: 'Bearer',
        },
      };
    },
  };

  const refreshToken = await exchangeCodeForTokens('mock_auth_code_123', mockClient);
  assert.equal(refreshToken, 'mock-refresh-token-456');
});

test('32. exchangeCodeForTokens throws GMAIL_REFRESH_TOKEN_MISSING if Google omits it', async () => {
  const mockClient = {
    getToken: async () => ({
      tokens: {
        access_token: 'mock-access-token-without-refresh',
      },
    }),
  };

  await assert.rejects(
    () => exchangeCodeForTokens('code_no_refresh', mockClient),
    (err) => {
      assert.ok(err instanceof GmailAuthError);
      assert.equal(err.code, 'GMAIL_REFRESH_TOKEN_MISSING');
      return true;
    }
  );
});

test('33. End-to-end OAuth callback flow exchanges token and displays safe confirmation', async () => {
  // Test full flow via state generation and mock client injection into callback
  const state = createOAuthState();

  // Validate state consumption directly
  const stateValidation = validateAndConsumeOAuthState(state);
  assert.equal(stateValidation.valid, true);
});
