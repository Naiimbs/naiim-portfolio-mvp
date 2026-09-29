import fs from 'node:fs';
import path from 'node:path';
import { resolveMCPConnection, getSafeConnectionInfo } from './mcpConnections.js';

/**
 * Safe environment loader for .env without external dependencies
 */
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx > 0) {
        const key = trimmed.slice(0, equalsIdx).trim();
        let val = trimmed.slice(equalsIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function checkMcpEndpoint() {
  const requestedKey = process.argv[2] || 'n8n-main';

  console.log('====================================================');
  console.log('  MCP DIAGNOSTIC CHECK (Phase 14.3)');
  console.log('====================================================\n');

  console.log(`Connection Key: ${requestedKey}`);
  const connInfo = getSafeConnectionInfo(requestedKey);
  const resolved = resolveMCPConnection(requestedKey);

  if (!resolved.isConfigured || !resolved.serverUrl) {
    console.log('MCP server: NOT CONFIGURED');
    console.log(`Reason: Server secrets for connection key "${requestedKey}" are missing in .env`);
    console.log('\nPlease add the following server-side environment variables to .env:');
    console.log(`N8N_MCP_SERVER_URL=https://your-n8n-instance/mcp-server/http`);
    console.log(`N8N_MCP_ACCESS_TOKEN=your_token_here\n`);
    return;
  }

  console.log('MCP server: CONFIGURED');
  console.log(`Endpoint host: ${connInfo.host || 'unknown'}`);
  console.log(`Endpoint path: ${connInfo.path || 'unknown'}`);
  console.log(`Token provided: ${connInfo.hasToken ? 'YES (masked)' : 'NO'}\n`);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };

  if (resolved.accessToken) {
    headers['Authorization'] = `Bearer ${resolved.accessToken.trim()}`;
  }

  // 1. Test Reachability & Initialize
  console.log('Step 1: Testing MCP initialization (`initialize`)...');
  const initPayload = {
    jsonrpc: '2.0',
    id: 'init_diag_1',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: false },
        sampling: {},
      },
      clientInfo: {
        name: 'naim-portfolio-gateway',
        version: '1.0.0',
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const initRes = await fetch(resolved.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(initPayload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log(`HTTP Status: ${initRes.status} ${initRes.statusText}`);

    if (!initRes.ok) {
      console.log('MCP connection: FAILED');
      if (initRes.status === 401 || initRes.status === 403) {
        console.log('Reason: Authentication rejected. Please verify N8N_MCP_ACCESS_TOKEN.');
      } else {
        console.log(`Reason: HTTP ${initRes.status}`);
      }
      return;
    }

    const initData = await initRes.json();
    if (initData.error) {
      console.log(`MCP initialization rejected: ${initData.error.message || JSON.stringify(initData.error)}`);
    } else {
      console.log('MCP initialization: SUCCESS');
      console.log(`Server Info: ${initData.result?.serverInfo?.name || 'unknown'} (${initData.result?.serverInfo?.version || 'unknown'})`);
      console.log(`Protocol version: ${initData.result?.protocolVersion || 'verified'}`);
    }

    // Step 2: Send initialized notification
    try {
      await fetch(resolved.serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      });
    } catch {
      // Best effort notification
    }

    // Step 3: Discover Tools (tools/list)
    console.log('\nStep 2: Discovering tools (`tools/list`)...');
    const toolsPayload = {
      jsonrpc: '2.0',
      id: 'tools_diag_2',
      method: 'tools/list',
      params: {},
    };

    const toolsRes = await fetch(resolved.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(toolsPayload),
    });

    if (!toolsRes.ok) {
      console.log(`Tools discovery failed with HTTP ${toolsRes.status}`);
      return;
    }

    const toolsData = await toolsRes.json();
    if (toolsData.error) {
      console.log(`Tools discovery error: ${toolsData.error.message}`);
      return;
    }

    const tools = toolsData.result?.tools || [];
    console.log(`Tools discovered: ${tools.length}\n`);

    if (tools.length === 0) {
      console.log('No tools currently exposed by this MCP endpoint.');
    } else {
      console.log('Available tools:');
      for (const t of tools) {
        console.log(`- ${t.name}: ${t.description || 'No description'}`);
        if (t.inputSchema?.properties) {
          console.log(`    Parameters: ${Object.keys(t.inputSchema.properties).join(', ')}`);
        }
      }
    }

    console.log('\n====================================================');
    console.log('  MCP DIAGNOSTIC COMPLETE');
    console.log('====================================================');
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('MCP connection: TIMEOUT (10s exceeded)');
    } else {
      console.log(`MCP connection: FAILED (${err.message})`);
    }
  }
}

checkMcpEndpoint();
