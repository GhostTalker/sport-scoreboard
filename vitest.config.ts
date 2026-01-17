import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/**/*.{ts,tsx}',
        'server/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'server/**/*.test.ts',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    // Enable fake timers for testing timeouts and retries
    fakeTimers: {
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    },
    // Parallel test execution (Vitest 4 moved poolOptions to top level)
    pool: 'threads',
    testTimeout: 10000, // Increase timeout for slow tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
