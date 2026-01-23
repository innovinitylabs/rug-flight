import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: '.',
  server: {
    port: 4000,
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'core'),
      '@games': resolve(__dirname, 'games'),
      '@shared': resolve(__dirname, 'shared')
    }
  },
  optimizeDeps: {
    include: ['three', 'gsap']
  }
});