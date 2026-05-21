import "dotenv/config";

import { performance } from "node:perf_hooks";
import { neon } from "@neondatabase/serverless";

const BASE_URL = (process.env.PERFORMANCE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const THRESHOLD_MS = Number(process.env.PERFORMANCE_SLOW_THRESHOLD_MS ?? 1000);
const ADMIN_EMAIL = process.env.PERFORMANCE_ADMIN_EMAIL ?? "perf-admin@performance.eventor.local";
const USER_EMAIL = process.env.PERFORMANCE_USER_EMAIL ?? "perf-user-0001@performance.eventor.local";
const PASSWORD = process.env.PERFORMANCE_SEED_PASSWORD ?? "pass123";
const DATABASE_URL =
  process.env.PERFORMANCE_DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "PERFORMANCE_DATABASE_URL, TEST_DATABASE_URL, or DATABASE_URL is required to find seeded IDs.",
  );
}

const sql = neon(DATABASE_URL);

async function main() {
  const [adminSession, userSession, ids] = await Promise.all([
    login(ADMIN_EMAIL, PASSWORD),
    login(USER_EMAIL, PASSWORD),
    getSeededIds(),
  ]);

  const checks = [
    { label: "/dashboard", path: "/dashboard", session: userSession },
    { label: "/groups", path: "/groups", session: userSession },
    { label: "/groups/[id]", path: `/groups/${ids.groupId}`, session: userSession },
    { label: "/events/[id]", path: `/events/${ids.eventId}`, session: userSession },
    { label: "/admin", path: "/admin", session: adminSession },
    { label: "/admin/users", path: "/admin/users", session: adminSession },
    { label: "/admin/groups", path: "/admin/groups", session: adminSession },
    { label: "/admin/events", path: "/admin/events", session: adminSession },
    {
      label: "GET /api/events?page=1&pageSize=20",
      path: "/api/events?page=1&pageSize=20",
      session: userSession,
      bearer: true,
    },
  ];

  const results = [];

  for (const check of checks) {
    results.push(await timeRequest(check));
  }

  console.table(
    results.map((result) => ({
      endpoint: result.label,
      status: result.status,
      ms: result.ms,
      slow: result.ms > THRESHOLD_MS ? "yes" : "",
    })),
  );

  const slow = results.filter((result) => result.ms > THRESHOLD_MS);

  if (slow.length > 0) {
    console.log(`Slow endpoints above ${THRESHOLD_MS} ms:`);
    for (const result of slow) {
      console.log(`- ${result.label}: ${result.ms} ms (${result.status})`);
    }
    process.exitCode = 1;
  } else {
    console.log(`All checked endpoints are at or below ${THRESHOLD_MS} ms.`);
  }
}

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed for ${email}: ${response.status}`);
  }

  const body = await response.json();

  if (!body.token) {
    throw new Error(`Login response for ${email} did not include a bearer token.`);
  }

  return {
    token: body.token,
    cookie: `eventor_session=${body.token}`,
  };
}

async function getSeededIds() {
  const [row] = await sql.query(
    `SELECT g.id AS group_id, e.id AS event_id
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     JOIN users u ON u.id = gm.user_id
     JOIN events e ON e.group_id = g.id
     WHERE g.title LIKE 'perf-group-%'
       AND u.email = $1
     ORDER BY g.id, e.id
     LIMIT 1`,
    [USER_EMAIL],
  );

  if (!row) {
    throw new Error("No performance seed group/event found. Run db:seed:performance first.");
  }

  return {
    groupId: row.group_id,
    eventId: row.event_id,
  };
}

async function timeRequest(check) {
  const headers = check.bearer
    ? { authorization: `Bearer ${check.session.token}` }
    : { cookie: check.session.cookie };
  const startedAt = performance.now();
  const response = await fetch(`${BASE_URL}${check.path}`, {
    headers,
    redirect: "manual",
  });
  const ms = Math.round(performance.now() - startedAt);

  await response.arrayBuffer();

  return {
    label: check.label,
    status: response.status,
    ms,
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
