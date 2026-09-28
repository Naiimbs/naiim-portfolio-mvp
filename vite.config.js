import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-rewrite-for-dev',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ? req.url.split('?')[0] : '';
          const isHtmlRequest =
            req.headers.accept?.includes('text/html') ||
            url === '/' ||
            url.startsWith('/admin') ||
            url.startsWith('/work');

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
