import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    mockReset: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // all + include: report every src file, not just ones a test loaded
      all: true,
      include: ["src/**/*.ts"],
      // main.ts drives real `stack` invocations; covered by .github/workflows/example.yml
      exclude: ["src/main.ts"],
      // Floors, not goals: set to the coverage the existing suite already
      // achieves, so the numbers cannot silently regress. Raise them alongside
      // any PR that adds tests.
      // Remove to stop enforcing coverage (also revert ci.yml's pnpm coverage -> pnpm test)
      thresholds: {
        lines: 48,
        branches: 62,
        functions: 53,
        statements: 48,
      },
    },
  },
});
