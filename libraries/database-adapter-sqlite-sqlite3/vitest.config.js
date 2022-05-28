export default {
  test: {
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    watch: false,
    // Disable multi-threading. For some reason it results in a v8 crash
    minThreads: 1,
    maxThreads: 1,
  },
};
