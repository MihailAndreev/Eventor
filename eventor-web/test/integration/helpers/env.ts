import "dotenv/config";

export function getSafeTestDatabaseUrl() {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for integration tests.");
  }

  if (databaseUrl && databaseUrl === testDatabaseUrl) {
    return testDatabaseUrl;
  }

  if (databaseUrl && databaseUrl !== testDatabaseUrl) {
    throw new Error(
      "Integration tests must run with DATABASE_URL mapped to TEST_DATABASE_URL.",
    );
  }

  return testDatabaseUrl;
}

export function configureIntegrationEnv() {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
  const originalDatabaseUrl =
    process.env.EVENTOR_ORIGINAL_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for integration tests.");
  }

  if (originalDatabaseUrl && originalDatabaseUrl === testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL must not be the same as DATABASE_URL.");
  }

  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.JWT_SECRET ??= "integration-test-jwt-secret-at-least-32-chars";
}
