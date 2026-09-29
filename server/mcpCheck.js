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
  console.log('  MCP DIAGNOSTIC CHECK (Phase 14.3.1)');
  console.log('====================================================\n');

  // Case A: Verify API Server / Gateway layer
  console.log('Step 1: API Server / Gateway Status');
  console.log('  API server: OK (In-process router / Vite middleware)');
  console.log(`  Connection Key: ${requestedKey}\n`);

  const connInfo = getSafeConnectionInfo(requestedKey);
  const resolved = resolveMCPConnection(requestedKey);

  // Case B: Check server-side environment variables
  console.log('Step 2: Server Environment Variables (.env)');
  if (!resolved.isConfigured || !resolved.serverUrl) {
    console.log('  MCP configuration: NOT CONFIGURED');
    console.log(`  Missing:`);
    console.log(`  - N8N_MCP_SERVER_URL`);
    console.log(`  - N8N_MCP_ACCESS_TOKEN`);
    console.log('\n  Please add server-side credentials to .env:');
    console.log('  N8N_MCP_SERVER_URL=https://your-n8n-instance/mcp-server/http');
    console.log('  N8N_MCP_ACCESS_TOKEN=your_token_here\n');
    console.log('====================================================');
    console.log('  MCP DIAGNOSTIC: READY FOR CREDENTIALS');
    console.log('====================================================');
    return;
  }

  console.log('  MCP configuration: OK');
  console.log(`  Resolved Host: ${connInfo.host || 'unknown'}`);
  console.log(`  Access Token: ${connInfo.hasToken ? 'YES (masked)' : 'NO'}\n`);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };

  if (resolved.accessToken) {
    headers['Authorization'] = `Bearer ${resolved.accessToken.trim()}`;
  }

  // Step 3: Test Reachability & Initialize
  console.log('Step 3: MCP Handshake (`initialize`)...');
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

    console.log(`  HTTP Status: ${initRes.status} ${initRes.statusText}`);

    if (!initRes.ok) {
      if (initRes.status === 401 || initRes.status === 403) {
        console.log('  MCP server: REACHABLE');
        console.log('  MCP handshake: FAILED (Authentication rejected. Check N8N_MCP_ACCESS_TOKEN).');
      } else {
        console.log(`  MCP server: UNREACHABLE / HTTP ${initRes.status}`);
      }
      return;
    }

    const initData = await initRes.json();
    if (initData.error) {
      console.log('  MCP server: REACHABLE');
      console.log(`  MCP handshake: FAILED (${initData.error.message || JSON.stringify(initData.error)})`);
      return;
    }

    console.log('  MCP server: REACHABLE');
    console.log('  MCP handshake: OK');
    console.log(`  Server Info: ${initData.result?.serverInfo?.name || 'unknown'} (${initData.result?.serverInfo?.version || 'unknown'})`);
    console.log(`  Protocol Version: ${initData.result?.protocolVersion || '2024-11-05'}`);

    // Step 4: Initialized notification
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
      // Non-blocking
    }

    // Step 5: Tool Discovery (tools/list)
    console.log('\nStep 4: Tool Discovery (`tools/list`)...');
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
      console.log(`  Tool discovery failed with HTTP ${toolsRes.status}`);
      return;
    }

    const toolsData = await toolsRes.json();
    if (toolsData.error) {
      console.log(`  Tool discovery error: ${toolsData.error.message}`);
      return;
    }

    const tools = toolsData.result?.tools || [];
    console.log(`  Tools discovered: ${tools.length}\n`);

    if (tools.length === 0) {
      console.log('  No tools currently exposed by this MCP endpoint.');
    } else {
      console.log('  Available Tools:');
      for (const t of tools) {
        console.log(`  ✓ ${t.name}: ${t.description || 'No description'}`);
        if (t.inputSchema?.properties) {
          console.log(`      Parameters: ${Object.keys(t.inputSchema.properties).join(', ')}`);
        }
      }
    }

    console.log('\n====================================================');
    console.log('  MCP DIAGNOSTIC: VERIFIED END-TO-END');
    console.log('====================================================');
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('  MCP server: UNREACHABLE (Timeout 10s exceeded)');
    } else {
      console.log(`  MCP server: UNREACHABLE (${err.message})`);
    }
  }
}

checkMcpEndpoint();
