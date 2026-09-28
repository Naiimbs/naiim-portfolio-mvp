import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-rewrite-for-dev',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Serve react.html on root / and /index.html in dev mode while keeping original index.html intact
          if (req.url === '/' || req.url === '/index.html') {
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
