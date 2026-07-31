import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Keep in sync with vite.config.ts. fileURLToPath yields a platform-
      // correct path; URL.pathname would produce "/C:/.../src" on Windows.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 10_000,
  },
});
