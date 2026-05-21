import "dotenv/config";

import { spawnSync } from "node:child_process";

const dbUrlSource = process.env.PERFORMANCE_DATABASE_URL
  ? "PERFORMANCE_DATABASE_URL"
  : process.env.TEST_DATABASE_URL
    ? "TEST_DATABASE_URL"
    : "DATABASE_URL";
const DATABASE_URL =
  process.env.PERFORMANCE_DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "PERFORMANCE_DATABASE_URL, TEST_DATABASE_URL, or DATABASE_URL is required.",
  );
}

if (process.env.ALLOW_PERFORMANCE_SEED !== "true") {
  throw new Error(
    "Refusing to migrate performance database. Set ALLOW_PERFORMANCE_SEED=true explicitly.",
  );
}

if (!looksLikeSafeDatabaseUrl(DATABASE_URL, dbUrlSource)) {
  throw new Error(
    "Refusing to migrate performance database. The DB URL must look like a test/dev/performance database.",
  );
}

if (dbUrlSource === "DATABASE_URL" && process.env.CONFIRM_DATABASE_URL_PERFORMANCE_SEED !== "true") {
  throw new Error(
    "Refusing to use DATABASE_URL for performance workflow without CONFIRM_DATABASE_URL_PERFORMANCE_SEED=true.",
  );
}

console.log(`Running Drizzle migrations for performance target: ${dbUrlSource}`);

const result = spawnSync("npx", ["drizzle-kit", "migrate"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DATABASE_URL,
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

function looksLikeSafeDatabaseUrl(value, source) {
  const normalized = value.toLowerCase();

  if (/(prod|production|main)/.test(normalized)) {
    return false;
  }

  if (source === "PERFORMANCE_DATABASE_URL" || source === "TEST_DATABASE_URL") {
    return true;
  }

  return /(test|dev|local|perf|performance|branch)/.test(normalized);
}
