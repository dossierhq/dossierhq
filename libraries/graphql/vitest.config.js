export default {
  test: {
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    watch: false,
    setupFiles: ['./src/test/setup.ts'],
  },
};
