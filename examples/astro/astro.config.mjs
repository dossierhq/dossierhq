import node from '@astrojs/node';
import react from '@astrojs/react';
import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';
import { defineConfig } from 'astro/config';

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
    },
    server: {
      fs: {
        // The monorepo root
        allow: ['../..'],
      },
      watch: {
        ignored: ['**/*.log', '**/dist/**', '**/.rush/**', '**/database/*'],
      },
    },
  },
});
