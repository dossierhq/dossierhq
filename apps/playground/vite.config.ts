import react from '@vitejs/plugin-react';
import visualizer from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: { include: [] },
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      plugins: [visualizer()],
    },
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
      '@jonasb/datadata-admin-react-components',
      '@jonasb/datadata-core',
      '@jonasb/datadata-database-adapter-sqlite-sql.js',
      '@jonasb/datadata-design',
      '@jonasb/datadata-server',
    ],
  },
});
