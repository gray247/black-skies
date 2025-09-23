import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the renderer process. Electron loads assets from the
// generated dist folder, so keep relative paths intact.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  base: './',
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
  },
});
