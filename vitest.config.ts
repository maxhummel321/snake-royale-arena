import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.output/**", "**/.tanstack/**"],
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
