import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import path from "node:path";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["tests/**/*.test.*"],
    exclude: [
      "**/node_modules/**",
      "**/.opencode/**",
      "**/tmp/**",
      "**/dist/**",
    ],
  },
});