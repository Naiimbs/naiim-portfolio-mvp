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
});
