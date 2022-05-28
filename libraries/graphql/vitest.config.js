export default {
  test: {
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    watch: false,
    setupFiles: ['./src/test/setup.ts'],
    threads: false,
    minThreads: 1,
    maxThreads: 1,
  },
};
