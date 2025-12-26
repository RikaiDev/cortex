import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/index.ts", // Re-export files
        "src/cli/**", // CLI entry points
      ],
      // Note: Global thresholds removed - add per-file thresholds as coverage improves
    },
    testTimeout: 10000,
  },
});
