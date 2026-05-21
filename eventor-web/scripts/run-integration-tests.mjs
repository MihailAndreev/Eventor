import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config } from "dotenv";

config();

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
const productionDatabaseUrl = process.env.DATABASE_URL?.trim();

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required to run integration tests.");
}

if (productionDatabaseUrl && testDatabaseUrl === productionDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must not be the same as DATABASE_URL.");
}

const isWatch = process.argv.includes("--watch");
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const vitestBin = resolve(scriptDirectory, "../../node_modules/vitest/vitest.mjs");
const executable = process.execPath;
const args = [
  vitestBin,
  isWatch ? "--config" : "run",
  ...(isWatch ? ["vitest.integration.config.ts"] : ["--config", "vitest.integration.config.ts"]),
];

const result = spawnSync(executable, args, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    EVENTOR_ORIGINAL_DATABASE_URL: productionDatabaseUrl ?? "",
    DATABASE_URL: testDatabaseUrl,
    NODE_ENV: "test",
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
