import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: 'tests/e2e/.env' });

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
