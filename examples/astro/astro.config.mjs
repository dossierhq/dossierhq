import node from '@astrojs/node';
import react from '@astrojs/react';
import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';
import { defineConfig } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [sentry(), spotlightjs(), react({ include: ['**/src/dossier/**'] })],
  vite: {
    build: {
      chunkSizeWarningLimit: 900,
      sourcemap: true,
      rollupOptions: {
        plugins: [visualizer()],
      },
    },
    server: {
      fs: {
        // The monorepo root
        allow: ['../..'],
      },
      hmr: {
        port: 4322,
      },
      watch: {
        ignored: ['**/*.log', '**/dist/**', '**/.rush/**', '**/database/*'],
      },
    },
  },
});
