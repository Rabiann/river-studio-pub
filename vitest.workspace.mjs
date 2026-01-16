export default [
    'vitest.node.config.mjs',
    {
        extends: 'src/renderer/vite.config.ts',
        test: {
            name: 'renderer',
            root: 'src/renderer',
            include: ['components/__tests__/**/*.{test,spec}.{ts,tsx}'],
            environment: 'jsdom',
            setupFiles: ['./vitest.setup.ts'],
        },
    },
];
