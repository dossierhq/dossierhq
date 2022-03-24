import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: { include: [] },
  },
  optimizeDeps: {
    include: [
      "@jonasb/datadata-admin-react-components",
      "@jonasb/datadata-core",
      "@jonasb/datadata-database-adapter-sqlite-sql.js",
      "@jonasb/datadata-design",
      "@jonasb/datadata-server",
    ],
  },
});
