import node from '@astrojs/node';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react({ include: ['**/src/dossier/**'] })],
  vite: {
    build: {
      chunkSizeWarningLimit: 900,
    },
    server: {
      watch: {
        ignored: ['**/*.log', '**/dist/**', '**/.rush/**', '**/database/*'],
      },
    },
  },
});
