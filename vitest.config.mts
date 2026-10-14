import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Same "@/..." imports as tsconfig.json.
    alias: { "@": root },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Route modules load Mongoose and Cloudinary on first import, which can be slow on CI.
    testTimeout: 20_000,
  },
});
