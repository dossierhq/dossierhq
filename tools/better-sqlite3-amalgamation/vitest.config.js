export default {
  test: {
    alias: {
      '@dossierhq/better-sqlite3': new URL(
        '../../libraries/better-sqlite3/src/index.ts',
        import.meta.url
      ).pathname,
      '@dossierhq/core': new URL('../../libraries/core/src/index.ts', import.meta.url).pathname,
      '@dossierhq/integration-test': new URL(
        '../../libraries/integration-test/src/index.ts',
        import.meta.url
      ).pathname,
      '@dossierhq/server': new URL('../../libraries/server/src/index.ts', import.meta.url).pathname,
    },
    coverage: {
      allowExternal: true,
    },
    include: [
      'src/**/*.test.ts',
      '../../libraries/better-sqlite3/src/**/*.test.ts',
      '../../libraries/core/src/**/*.test.ts',
      '../../libraries/server/src/**/*.test.ts',
    ],
    watch: false,
  },
};
