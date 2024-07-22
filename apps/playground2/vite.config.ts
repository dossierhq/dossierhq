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
  optimizeDeps: {
    include: [
      '@dossierhq/core',
      '@dossierhq/react-components2',
      '@dossierhq/sql.js',
      '@dossierhq/server',
    ],
  },
});
