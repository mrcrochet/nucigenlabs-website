import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sitemapPlugin } from './vite-plugin-sitemap';
import { defineConfig as defineVitestConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sitemapPlugin(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('Proxy error:', err);
          });
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Let Vite handle chunk splitting automatically to avoid circular dependencies
    // Manual chunking was causing "useState is undefined" errors in production
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify for production
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Copy service worker to dist
    copyPublicDir: true,
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    // Resolve .js imports for ES modules
    resolve: {
      alias: {
        // Ensure proper resolution of .js extensions in imports
      },
    },
  },
});
