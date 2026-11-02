/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative base keeps the build portable for GitHub Pages project sites,
// custom domains and local previews alike.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    css: false,
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
  },
});
