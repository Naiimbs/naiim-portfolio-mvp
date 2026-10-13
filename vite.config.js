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
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('bootstrap')) return 'vendor-bootstrap';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (
            id.includes('react-router') ||
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('react-helmet')
          ) {
            return 'vendor-react';
          }
          return 'vendor';
        },
      },
    },
  },
});
