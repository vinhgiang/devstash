import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": new URL("./tests/stubs/server-only.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "node",
    include: [
      "src/lib/**/*.test.ts",
      "src/actions/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    exclude: ["node_modules", ".next", "src/lib/generated/**"],
  },
})
