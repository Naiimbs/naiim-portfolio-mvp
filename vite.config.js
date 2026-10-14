import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-gateway-middleware',
      configureServer(server) {
        // 1. Handle /api/ requests via server-side MCP Gateway
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            const { handleApiRequest } = await import('./server/apiServer.js');
            const handled = await handleApiRequest(req, res);
            if (handled !== false) return;
          }
          next();
        });

        // 2. Fallback rewrite for legacy paths in dev (e.g., /case-studies/*.html -> /index.html)
        server.middlewares.use((req, res, next) => {
          const url = req.url ? req.url.split('?')[0] : '';
          if (url.startsWith('/case-studies') || url === '/index.html') {
            req.url = '/index.html';
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    open: true,
    watch: {
      ignored: ['**/server/.secrets.env**', '**/.git/**', '**/legacy/**'],
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Split only large, self-contained libraries into their own cacheable
          // chunks. Everything else (React, router, helmet, i18n and their small
          // helper deps) stays in one `vendor` chunk to avoid circular chunks.
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('jszip')) return 'vendor-jszip';
          if (id.includes('bootstrap')) return 'vendor-bootstrap';
          return 'vendor';
        },
      },
    },
  },
});
