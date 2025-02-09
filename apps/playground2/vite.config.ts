import path from 'node:path';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

const ReactCompilerConfig = {};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 800,
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
