import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@cultivation/game-rules': resolve(__dirname, '../../packages/game-rules/src/index.ts'),
    },
  },
});
