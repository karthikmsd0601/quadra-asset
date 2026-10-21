import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: "./env",
  define: {
    global: "globalThis",
  },
  server: {
    port: 53010,
    proxy: {
      "/asset": {
        target: "http://127.0.0.1:5100",
        changeOrigin: true,
      },
      "/api": {
        target: "http://127.0.0.1:5100",
        changeOrigin: true,
      },
    },
  },
});
