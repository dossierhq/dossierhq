import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      plugins: [visualizer()],
    },
    sourcemap: true,
  },
  css: {
    postcss: {
      plugins: [
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule) => {
              if (atRule.name === 'charset') {
                atRule.remove();
              }
            },
          },
        },
      ],
    },
  },
  optimizeDeps: {
    include: [
      '@dossierhq/react-components',
      '@dossierhq/core',
      '@dossierhq/sql.js',
      '@dossierhq/design',
      '@dossierhq/server',
    ],
  },
});
