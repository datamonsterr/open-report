import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://localhost:4091",
      "/ws": {
        target: "ws://localhost:4096",
        ws: true,
      },
    },
  },
  build: {
    target: "esnext",
  },
});
