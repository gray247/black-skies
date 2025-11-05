import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the renderer process. Electron loads assets from the
// generated dist folder, so keep relative paths intact.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['renderer/**/*.test.{ts,tsx}', 'main/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['main/**/*.test.{ts,tsx}', 'node']],
    setupFiles: ['./renderer/testSetup.ts'],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }
          if (id.includes('@codemirror')) {
            return 'codemirror';
          }
          if (id.includes('react-dom') || id.includes('react/jsx-runtime')) {
            return 'react';
          }
          if (id.includes('react-mosaic-component')) {
            return 'mosaic';
          }
          if (id.includes('react-rnd') || id.includes('react-resizable')) {
            return 'layout-tools';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
});
