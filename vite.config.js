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

        // 2. HTML rewrite for client-side routing
        server.middlewares.use((req, res, next) => {
          const url = req.url ? req.url.split('?')[0] : '';
          const isHtmlRequest =
            req.headers.accept?.includes('text/html') ||
            url === '/' ||
            url.startsWith('/admin') ||
            url.startsWith('/work') ||
            url.startsWith('/agents');

          const isFileWithExtension = /\.[a-zA-Z0-9]+$/.test(url);

          if (isHtmlRequest && (!isFileWithExtension || url === '/index.html')) {
            req.url = '/react.html';
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: 'react.html',
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
