export default {
  resolve: {
    preserveSymlinks: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Keep the offline runner deterministic on high-core Windows hosts.
    maxWorkers: 4,
    include: ['renderer/**/*.test.{ts,tsx}', 'main/**/*.test.{ts,tsx}', 'shared/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['main/**/*.test.{ts,tsx}', 'node']],
    setupFiles: ['./renderer/testSetup.ts', './renderer/vitest.setup.ts'],
  },
};
