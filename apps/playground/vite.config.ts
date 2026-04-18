import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type Plugin } from 'vite';

// prismjs/components/prism-*.js are legacy browser scripts that reference a
// bare global `Prism`, and @lexical/code-prism adds its own `diff` language
// the same way. Import prismjs directly (so the main module's side effects
// are sequenced by the module graph) and bind a module-local `Prism`.
function prismGlobalShim(): Plugin {
  const pattern =
    /(?:\/prismjs\/components\/prism-[^/]+\.js|\/@lexical\/code-prism\/LexicalCodePrism\.[^/]+\.m?js)$/;
  return {
    name: 'prism-global-shim',
    enforce: 'pre',
    transform(code, id) {
      if (pattern.test(id)) {
        const prelude = `import __prismNs from 'prismjs';\nvar Prism = globalThis.Prism || __prismNs;\n`;
        return { code: prelude + code, map: null };
      }
      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), prismGlobalShim()],
  worker: {
    format: 'es',
  },
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
      'graphiql',
      '@graphiql/react',
    ],
    exclude: ['monaco-editor', 'monaco-graphql'],
  },
});
