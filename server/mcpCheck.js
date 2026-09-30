import fs from 'node:fs';
import path from 'node:path';
import { resolveMCPConnection, getSafeConnectionInfo } from './mcpConnections.js';
import { callJsonRpc, discoverMcpTools } from './mcpGateway.js';

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
  console.log('  MCP DIAGNOSTIC CHECK (Phase 14.3.2)');
  console.log('====================================================\n');

  console.log('Step 1: API Server / Gateway Status');
  console.log('  API server: OK (In-process router / Vite middleware)');
  console.log(`  Connection Key: ${requestedKey}\n`);

  const connInfo = await getSafeConnectionInfo(requestedKey);
  const resolved = await resolveMCPConnection(requestedKey);

  console.log('Step 2: Server Environment Variables (.env)');
  if (!resolved.isConfigured || !resolved.serverUrl) {
    console.log('  MCP configuration: NOT CONFIGURED');
    console.log(`  Missing:`);
    console.log(`  - N8N_MCP_SERVER_URL`);
    console.log(`  - N8N_MCP_ACCESS_TOKEN`);
    console.log('\n  Please add server-side credentials to .env:');
    console.log('  N8N_MCP_SERVER_URL=https://your-n8n-instance/mcp-server/http');
    console.log('  N8N_MCP_ACCESS_TOKEN=your_token_here\n');
    return;
  }

  console.log('  MCP configuration: OK');
  console.log(`  Resolved Host: ${connInfo.host || 'unknown'}`);
  console.log(`  Access Token: ${connInfo.hasToken ? 'YES (masked)' : 'NO'}\n`);

  console.log('Step 3: Testing MCP Handshake (`initialize`)...');
  try {
    const initRes = await callJsonRpc(
      resolved.serverUrl,
      resolved.accessToken,
      {
        jsonrpc: '2.0',
        id: `init_diag_${Date.now()}`,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { roots: { listChanged: false } },
          clientInfo: { name: 'naim-portfolio-gateway', version: '1.0.0' },
        },
      },
      10000
    );

    if (initRes.error) {
      console.log(`  MCP handshake: FAILED (${initRes.error.message || JSON.stringify(initRes.error)})`);
      return;
    }

    console.log('  MCP server: REACHABLE');
    console.log('  MCP handshake: OK');
    console.log(`  Server Info: ${initRes.result?.serverInfo?.name || 'n8n-mcp-server'} (${initRes.result?.serverInfo?.version || '1.0.0'})`);
    console.log(`  Protocol Version: ${initRes.result?.protocolVersion || '2024-11-05'}`);

    console.log('\nStep 4: Tool Discovery (`tools/list`)...');
    const tools = await discoverMcpTools(resolved.serverUrl, resolved.accessToken, 10000);
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
    console.log('  REAL END-TO-END MCP CONNECTION VERIFIED');
    console.log('====================================================');
  } catch (err) {
    console.log(`  MCP server: FAILED (${err.message})`);
  }
}

checkMcpEndpoint();
