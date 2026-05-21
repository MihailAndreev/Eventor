import "dotenv/config";

import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const USER_COUNT = 3_000;
const GROUP_COUNT = 500;
const EVENT_COUNT = 5_000;
const PASSWORD = process.env.PERFORMANCE_SEED_PASSWORD ?? "pass123";
const USER_DOMAIN = "performance.eventor.local";
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
    "Refusing to seed performance data. Set ALLOW_PERFORMANCE_SEED=true explicitly.",
  );
}

if (!looksLikeSafeDatabaseUrl(DATABASE_URL, dbUrlSource)) {
  throw new Error(
    "Refusing to seed performance data. The DB URL must look like a test/dev/performance database.",
  );
}

if (dbUrlSource === "DATABASE_URL" && process.env.CONFIRM_DATABASE_URL_PERFORMANCE_SEED !== "true") {
  throw new Error(
    "Refusing to use DATABASE_URL for performance seed without CONFIRM_DATABASE_URL_PERFORMANCE_SEED=true.",
  );
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log(`Performance seed target: ${dbUrlSource}`);
  console.log(
    "WARNING: this removes existing Eventor performance seed data before inserting a large test dataset.",
  );
  console.log("It only deletes perf-* groups and @performance.eventor.local users.");

  await clearPerformanceData();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const usersByKey = await seedUsers(passwordHash);
  const groupsByIndex = await seedGroups(usersByKey);
  const membershipsByGroup = await seedMemberships(usersByKey, groupsByIndex);
  const eventsByIndex = await seedEvents(usersByKey, groupsByIndex);
  await seedEventParticipants(membershipsByGroup, eventsByIndex);
  await seedComments(membershipsByGroup, eventsByIndex);
  await seedEventLinks(usersByKey, eventsByIndex);

  const report = await getReport();
  console.table(report);
  console.log("Performance seed data ready.");
  console.log(`Admin login: perf-admin@${USER_DOMAIN} / ${PASSWORD}`);
  console.log(`Regular login: perf-user-0001@${USER_DOMAIN} / ${PASSWORD}`);
}

async function clearPerformanceData() {
  await sql.query("DELETE FROM groups WHERE title LIKE 'perf-group-%'");
  await sql.query("DELETE FROM users WHERE email LIKE $1", [`%@${USER_DOMAIN}`]);
}

async function seedUsers(passwordHash) {
  const rows = [];

  rows.push({
    key: "admin",
    email: `perf-admin@${USER_DOMAIN}`,
    name: "Performance Admin",
    role: "admin",
  });

  for (let index = 1; index <= USER_COUNT - 1; index += 1) {
    const isManager = index <= 120;
    rows.push({
      key: `user-${index}`,
      email: `perf-user-${String(index).padStart(4, "0")}@${USER_DOMAIN}`,
      name: isManager
        ? `Performance Manager ${String(index).padStart(3, "0")}`
        : `Performance User ${String(index).padStart(4, "0")}`,
      role: "user",
    });
  }

  const inserted = await insertUsers(rows, passwordHash);
  return new Map(inserted.map((row) => [row.email, row.id]));
}

async function seedGroups(usersByKey) {
  const rows = [];

  for (let index = 1; index <= GROUP_COUNT; index += 1) {
    const managerIndex = ((index * 7) % 120) + 1;

    rows.push({
      index,
      title: `perf-group-${String(index).padStart(4, "0")} ${groupTheme(index)}`,
      description: `Performance test group for ${groupTheme(index).toLowerCase()} events, recurring planning, and member coordination.`,
      createdByUserId: usersByKey.get(`perf-user-${String(managerIndex).padStart(4, "0")}@${USER_DOMAIN}`),
    });
  }

  const inserted = await insertGroups(rows);
  return new Map(inserted.map((row) => [row.title, row.id]));
}

async function seedMemberships(usersByKey, groupsByIndex) {
  const rows = [];
  const membershipsByGroup = new Map();

  for (let groupIndex = 1; groupIndex <= GROUP_COUNT; groupIndex += 1) {
    const title = `perf-group-${String(groupIndex).padStart(4, "0")} ${groupTheme(groupIndex)}`;
    const groupId = groupsByIndex.get(title);
    const groupMembers = [];
    const managerCount = 1 + (groupIndex % 3);

    for (let offset = 0; offset < managerCount; offset += 1) {
      const managerIndex = ((groupIndex * 7 + offset * 13) % 120) + 1;
      groupMembers.push({
        userId: usersByKey.get(`perf-user-${String(managerIndex).padStart(4, "0")}@${USER_DOMAIN}`),
        isManager: true,
      });
    }

    const memberCount = 24 + (groupIndex % 57);
    for (let offset = 0; offset < memberCount; offset += 1) {
      const userIndex = ((groupIndex * 31 + offset * 17) % (USER_COUNT - 1)) + 1;
      groupMembers.push({
        userId: usersByKey.get(`perf-user-${String(userIndex).padStart(4, "0")}@${USER_DOMAIN}`),
        isManager: false,
      });
    }

    const uniqueMembers = dedupeMembers(groupMembers);
    membershipsByGroup.set(groupId, uniqueMembers.map((member) => member.userId));

    for (const member of uniqueMembers) {
      rows.push({
        groupId,
        userId: member.userId,
        isManager: member.isManager,
      });
    }
  }

  await insertMemberships(rows);
  return membershipsByGroup;
}

async function seedEvents(usersByKey, groupsByIndex) {
  const rows = [];

  for (let index = 1; index <= EVENT_COUNT; index += 1) {
    const groupIndex = ((index - 1) % GROUP_COUNT) + 1;
    const managerIndex = ((groupIndex * 7) % 120) + 1;
    const title = `perf-group-${String(groupIndex).padStart(4, "0")} ${groupTheme(groupIndex)}`;
    const groupId = groupsByIndex.get(title);
    const dateOffset = getDateOffset(index);
    const capacity =
      index % 5 === 0 ? null : index % 11 === 0 ? 8 + (index % 7) : 20 + (index % 45);

    rows.push({
      index,
      groupId,
      title: `Performance Event ${String(index).padStart(5, "0")}`,
      description: `Deterministic performance event ${index} with enough text to resemble a real Eventor plan.`,
      eventDate: dateWithOffset(dateOffset),
      eventTime: `${String(7 + (index % 14)).padStart(2, "0")}:${index % 2 === 0 ? "00" : "30"}`,
      location: `${locationName(index)} Hall ${1 + (index % 9)}`,
      capacity,
      canceled: index % 17 === 0,
      createdByUserId: usersByKey.get(`perf-user-${String(managerIndex).padStart(4, "0")}@${USER_DOMAIN}`),
      coverImageUrl: index % 19 === 0 ? `/eventor-logo.svg` : null,
    });
  }

  const inserted = await insertEvents(rows);
  return inserted.map((row, index) => ({ ...row, sourceIndex: index + 1 }));
}

async function seedEventParticipants(membershipsByGroup, eventsByIndex) {
  const rows = [];

  for (const event of eventsByIndex) {
    const members = membershipsByGroup.get(event.group_id) ?? [];
    const targetCount = getParticipantTarget(event.sourceIndex, event.capacity, members.length);

    for (let offset = 0; offset < targetCount; offset += 1) {
      rows.push({
        eventId: event.id,
        userId: members[(event.sourceIndex * 5 + offset * 3) % members.length],
        status: getParticipantStatus(event.sourceIndex, offset, event.capacity, targetCount),
        extraSlots: offset % 13 === 0 ? 1 : 0,
      });
    }
  }

  await insertParticipants(rows);
}

async function seedComments(membershipsByGroup, eventsByIndex) {
  const rows = [];
  const commentTexts = [
    "Looking forward to this event.",
    "Can someone confirm the meeting point?",
    "I may arrive a few minutes late.",
    "Happy to help with setup.",
    "This schedule works well for me.",
    "Please share any updates here.",
  ];

  for (const event of eventsByIndex) {
    const members = membershipsByGroup.get(event.group_id) ?? [];
    const commentCount = event.sourceIndex % 4 === 0 ? 0 : 1 + (event.sourceIndex % 6);

    for (let offset = 0; offset < commentCount; offset += 1) {
      rows.push({
        eventId: event.id,
        userId: members[(event.sourceIndex * 11 + offset * 7) % members.length],
        text: commentTexts[(event.sourceIndex + offset) % commentTexts.length],
      });
    }
  }

  await insertComments(rows);
}

async function seedEventLinks(usersByKey, eventsByIndex) {
  const rows = [];
  const adminId = usersByKey.get(`perf-admin@${USER_DOMAIN}`);

  for (const event of eventsByIndex) {
    const linkCount = event.sourceIndex % 3 === 0 ? event.sourceIndex % 4 : 0;

    for (let offset = 0; offset < linkCount; offset += 1) {
      rows.push({
        eventId: event.id,
        title: ["Agenda", "Map", "Checklist"][offset],
        url: `https://example.com/eventor/performance/${event.id}/${offset + 1}`,
        createdByUserId: adminId,
      });
    }
  }

  await insertLinks(rows);
}

async function insertUsers(rows, passwordHash) {
  const inserted = [];

  for (const chunk of chunkRows(rows, 500)) {
    inserted.push(
      ...(await sql.query(
        `INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
         SELECT * FROM unnest($1::varchar[], $2::text[], $3::varchar[], $4::user_role[], $5::timestamptz[], $6::timestamptz[])
         RETURNING id, email`,
        [
          chunk.map((row) => row.email),
          chunk.map(() => passwordHash),
          chunk.map((row) => row.name),
          chunk.map((row) => row.role),
          chunk.map(() => new Date().toISOString()),
          chunk.map(() => new Date().toISOString()),
        ],
      )),
    );
  }

  return inserted;
}

async function insertGroups(rows) {
  const inserted = [];

  for (const chunk of chunkRows(rows, 250)) {
    inserted.push(
      ...(await sql.query(
        `INSERT INTO groups (title, description, created_by_user_id, cover_image_url, created_at, updated_at)
         SELECT * FROM unnest($1::varchar[], $2::text[], $3::int[], $4::text[], $5::timestamptz[], $6::timestamptz[])
         RETURNING id, title`,
        [
          chunk.map((row) => row.title),
          chunk.map((row) => row.description),
          chunk.map((row) => row.createdByUserId),
          chunk.map((row) => (row.index % 23 === 0 ? "/eventor-logo.svg" : null)),
          chunk.map(() => new Date().toISOString()),
          chunk.map(() => new Date().toISOString()),
        ],
      )),
    );
  }

  return inserted;
}

async function insertMemberships(rows) {
  for (const chunk of chunkRows(rows, 1_000)) {
    await sql.query(
      `INSERT INTO group_members (group_id, user_id, is_manager, joined_at)
       SELECT * FROM unnest($1::int[], $2::int[], $3::boolean[], $4::timestamptz[])
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [
        chunk.map((row) => row.groupId),
        chunk.map((row) => row.userId),
        chunk.map((row) => row.isManager),
        chunk.map(() => new Date().toISOString()),
      ],
    );
  }
}

async function insertEvents(rows) {
  const inserted = [];

  for (const chunk of chunkRows(rows, 500)) {
    inserted.push(
      ...(await sql.query(
        `INSERT INTO events (
           group_id, title, description, event_date, event_time, location, capacity,
           canceled, created_by_user_id, cover_image_url, created_at, updated_at
         )
         SELECT * FROM unnest(
           $1::int[], $2::varchar[], $3::text[], $4::date[], $5::time[], $6::text[],
           $7::int[], $8::boolean[], $9::int[], $10::text[], $11::timestamptz[], $12::timestamptz[]
         )
         RETURNING id, group_id, capacity`,
        [
          chunk.map((row) => row.groupId),
          chunk.map((row) => row.title),
          chunk.map((row) => row.description),
          chunk.map((row) => row.eventDate),
          chunk.map((row) => row.eventTime),
          chunk.map((row) => row.location),
          chunk.map((row) => row.capacity),
          chunk.map((row) => row.canceled),
          chunk.map((row) => row.createdByUserId),
          chunk.map((row) => row.coverImageUrl),
          chunk.map(() => new Date().toISOString()),
          chunk.map(() => new Date().toISOString()),
        ],
      )),
    );
  }

  return inserted;
}

async function insertParticipants(rows) {
  for (const chunk of chunkRows(rows, 2_000)) {
    await sql.query(
      `INSERT INTO event_participants (event_id, user_id, status, extra_slots, joined_at)
       SELECT * FROM unnest($1::int[], $2::int[], $3::event_participant_status[], $4::int[], $5::timestamptz[])
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [
        chunk.map((row) => row.eventId),
        chunk.map((row) => row.userId),
        chunk.map((row) => row.status),
        chunk.map((row) => row.extraSlots),
        chunk.map(() => new Date().toISOString()),
      ],
    );
  }
}

async function insertComments(rows) {
  for (const chunk of chunkRows(rows, 2_000)) {
    await sql.query(
      `INSERT INTO event_comments (event_id, user_id, text, created_at, updated_at)
       SELECT * FROM unnest($1::int[], $2::int[], $3::text[], $4::timestamptz[], $5::timestamptz[])`,
      [
        chunk.map((row) => row.eventId),
        chunk.map((row) => row.userId),
        chunk.map((row) => row.text),
        chunk.map(() => new Date().toISOString()),
        chunk.map(() => new Date().toISOString()),
      ],
    );
  }
}

async function insertLinks(rows) {
  for (const chunk of chunkRows(rows, 2_000)) {
    await sql.query(
      `INSERT INTO event_links (event_id, title, url, created_by_user_id, created_at, updated_at)
       SELECT * FROM unnest($1::int[], $2::varchar[], $3::text[], $4::int[], $5::timestamptz[], $6::timestamptz[])`,
      [
        chunk.map((row) => row.eventId),
        chunk.map((row) => row.title),
        chunk.map((row) => row.url),
        chunk.map((row) => row.createdByUserId),
        chunk.map(() => new Date().toISOString()),
        chunk.map(() => new Date().toISOString()),
      ],
    );
  }
}

async function getReport() {
  return sql.query(
    `SELECT 'users' AS table_name, count(*)::int AS count FROM users WHERE email LIKE $1
     UNION ALL
     SELECT 'groups', count(*)::int FROM groups WHERE title LIKE 'perf-group-%'
     UNION ALL
     SELECT 'events', count(*)::int FROM events e JOIN groups g ON g.id = e.group_id WHERE g.title LIKE 'perf-group-%'
     UNION ALL
     SELECT 'group_members', count(*)::int FROM group_members gm JOIN groups g ON g.id = gm.group_id WHERE g.title LIKE 'perf-group-%'
     UNION ALL
     SELECT 'event_participants', count(*)::int FROM event_participants ep JOIN events e ON e.id = ep.event_id JOIN groups g ON g.id = e.group_id WHERE g.title LIKE 'perf-group-%'
     UNION ALL
     SELECT 'event_comments', count(*)::int FROM event_comments ec JOIN events e ON e.id = ec.event_id JOIN groups g ON g.id = e.group_id WHERE g.title LIKE 'perf-group-%'
     UNION ALL
     SELECT 'event_links', count(*)::int FROM event_links el JOIN events e ON e.id = el.event_id JOIN groups g ON g.id = e.group_id WHERE g.title LIKE 'perf-group-%'`,
    [`%@${USER_DOMAIN}`],
  );
}

function dedupeMembers(members) {
  const byUserId = new Map();

  for (const member of members) {
    if (!member.userId) continue;
    const existing = byUserId.get(member.userId);
    byUserId.set(member.userId, {
      userId: member.userId,
      isManager: Boolean(existing?.isManager || member.isManager),
    });
  }

  return [...byUserId.values()];
}

function getParticipantTarget(index, capacity, memberCount) {
  if (capacity === null) {
    return Math.min(memberCount, 12 + (index % 35));
  }

  if (index % 11 === 0) {
    return Math.min(memberCount, capacity + 4);
  }

  if (index % 7 === 0) {
    return Math.min(memberCount, Math.max(1, capacity - 2));
  }

  return Math.min(memberCount, 5 + (index % Math.max(6, Math.min(capacity, 30))));
}

function getParticipantStatus(index, offset, capacity, targetCount) {
  if (capacity !== null && targetCount > capacity && offset >= capacity) {
    return "waiting_list";
  }

  if (index % 13 === 0 && offset % 9 === 0) {
    return "interested";
  }

  if (index % 19 === 0 && offset % 8 === 0) {
    return "not_going";
  }

  return "going";
}

function getDateOffset(index) {
  if (index % 17 === 0) return -30 - (index % 90);
  if (index % 5 === 0) return -1 * (index % 30);
  if (index % 23 === 0) return 0;
  return 1 + (index % 120);
}

function dateWithOffset(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function groupTheme(index) {
  const themes = [
    "Hiking Crew",
    "Study Circle",
    "Board Game Club",
    "Running Team",
    "Book Friends",
    "Volunteer Group",
    "Dance Practice",
    "Photo Walks",
  ];

  return themes[index % themes.length];
}

function locationName(index) {
  const locations = ["Community", "Riverside", "Northside", "Central", "Greenfield"];

  return locations[index % locations.length];
}

function chunkRows(rows, size) {
  const chunks = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
