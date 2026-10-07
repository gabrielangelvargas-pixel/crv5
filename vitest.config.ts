import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Only component tests pay for jsdom; domain and route tests run in plain Node.
    projects: [
      { extends: true, test: { name: "node", environment: "node", include: ["src/**/*.test.ts", "src/**/*.spec.ts"] } },
      { extends: true, test: { name: "dom", environment: "jsdom", include: ["src/**/*.test.tsx", "src/**/*.spec.tsx"], testTimeout: 15000 } },
    ],
  },
});
