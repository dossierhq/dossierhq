export default {
  test: {
    watch: false,
    projects: [
      {
        test: {
          name: 'file',
          include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          exclude: ['**/node_modules/**', 'src/test/integration/sqld/**'],
          watch: false,
        },
      },
      {
        test: {
          name: 'sqld',
          include: ['src/test/integration/sqld/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          watch: false,
          // Each file spawns one or more real sqld processes. Running them all at once
          // saturates a CI runner (which is also busy with lint/check-types), and every
          // sqld cold start then misses its health check at the same time. Run the files
          // one at a time instead; it costs ~10s and removes the contention entirely.
          fileParallelism: false,
          // Must stay well above SqldRunner's health-check deadline, so a genuine startup
          // failure surfaces the sqld log instead of a bare 'hook timed out'.
          hookTimeout: 60_000,
          testTimeout: 60_000,
        },
      },
    ],
  },
};
