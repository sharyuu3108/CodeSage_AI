import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 300000, // 5 minutes to allow initial one-time mongodb-memory-server binary download
  },
});
