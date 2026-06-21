import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The PostCSS config lives in `config/` (not the package root) so that workspace
  // consumers importing the prebuilt `lib/main.css` don't pick it up and try to
  // re-run `@tailwindcss/postcss` on already-compiled CSS.
  css: { postcss: 'config' },
});
