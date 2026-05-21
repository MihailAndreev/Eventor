import "dotenv/config";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/integration/**/*.integration.test.ts"],
    globalSetup: ["./test/integration/global-setup.ts"],
    setupFiles: ["./test/integration/setup-env.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts", "src/services/**/*.ts", "src/app/api/**/*.ts"],
      exclude: ["src/**/*.test.ts", "test/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "test/mocks/server-only.ts"),
    },
  },
});
