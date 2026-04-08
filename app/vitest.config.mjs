export default {
  resolve: {
    preserveSymlinks: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['renderer/**/*.test.{ts,tsx}', 'main/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['main/**/*.test.{ts,tsx}', 'node']],
    setupFiles: ['./renderer/testSetup.ts', './renderer/vitest.setup.ts'],
  },
};
