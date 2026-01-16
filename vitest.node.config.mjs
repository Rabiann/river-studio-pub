import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/main/**/__tests__/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['src/renderer/**', 'node_modules/**'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'dist/**'],
    },
  },
});
