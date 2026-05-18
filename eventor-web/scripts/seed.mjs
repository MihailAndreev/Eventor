import "dotenv/config";

import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const sql = neon(DATABASE_URL);

const sampleUsers = [
  "tom",
  "peter",
  "john",
  "ivan",
  "stefan",
  "maria",
  "anna",
  "elena",
  "george",
  "nick",
  "alex",
  "boris",
  "daniel",
  "mila",
  "nora",
  "sofia",
  "emma",
  "luka",
  "mark",
  "vera",
].map((name) => ({
  key: name,
  email: `${name}@gmail.com`,
  name: toDisplayName(name),
}));

const comments = [
  "I will come 10 minutes later.",
  "Can I bring a friend?",
  "Is the location confirmed?",
  "Looking forward to this event!",
  "Should we meet 15 minutes earlier?",
  "I can help with the organization.",
  "The weather looks good for this one.",
  "Please confirm if the event is still happening.",
];

const groupsSeed = [
  {
    key: "swimming",
    title: "Swimming Club",
    description: "A group for people who like swimming sessions and pool activities.",
    members: ["tom", "peter", "maria", "anna", "elena", "nick", "alex", "mila", "nora", "vera"],
    managers: ["tom", "maria"],
  },
  {
    key: "dance",
    title: "Dance Friends",
    description: "A group for organizing dance classes, practice sessions and social dance events.",
    members: ["john", "ivan", "stefan", "maria", "elena", "george", "sofia", "emma", "luka", "vera"],
    managers: ["john", "elena"],
  },
  {
    key: "hiking",
    title: "Hiking Crew",
    description: "A group for weekend hikes, nature walks and mountain trips.",
    members: ["tom", "ivan", "stefan", "george", "nick", "boris", "daniel", "mila", "luka", "mark"],
    managers: ["stefan", "george"],
  },
  {
    key: "puzzle",
    title: "Puzzle Masters",
    description: "A group for puzzle solving sessions, team puzzle challenges and competitions.",
    members: ["peter", "john", "anna", "alex", "boris", "daniel", "nora", "sofia", "emma", "mark"],
    managers: ["peter", "anna"],
  },
];

const eventsSeed = [
  {
    groupKey: "swimming",
    title: "Morning Lap Swim",
    dateOffset: -9,
    time: "08:30",
    location: "City Swimming Pool",
    capacity: 10,
    canceled: false,
    description: "Past lap swimming meetup with a relaxed training plan.",
    participants: [
      ["tom", 0],
      ["peter", 1],
      ["maria", 0],
      ["anna", 0],
      ["nick", 1],
      ["vera", 0],
    ],
    commentUsers: ["tom", "maria", "nick"],
  },
  {
    groupKey: "swimming",
    title: "Evening Swimming Session",
    dateOffset: 2,
    time: "19:00",
    location: "City Swimming Pool",
    capacity: 12,
    canceled: false,
    description: "Relaxed evening swimming session for group members.",
    participants: [
      ["tom", 0],
      ["peter", 1],
      ["maria", 0],
      ["elena", 0],
      ["alex", 1],
    ],
    commentUsers: ["peter", "anna", "maria"],
  },
  {
    groupKey: "swimming",
    title: "Sunday Pool Training",
    dateOffset: 6,
    time: "10:00",
    location: "Sports Center Pool",
    capacity: null,
    canceled: false,
    description: "Open swimming practice session without a fixed participant limit.",
    participants: [
      ["tom", 0],
      ["anna", 0],
      ["elena", 1],
      ["mila", 0],
      ["nora", 0],
    ],
    commentUsers: ["elena", "mila", "vera"],
  },
  {
    groupKey: "dance",
    title: "Beginner Waltz Workshop",
    dateOffset: -8,
    time: "18:30",
    location: "Dance Studio 21",
    capacity: 14,
    canceled: false,
    description: "Past workshop focused on basic waltz rhythm and partner movement.",
    participants: [
      ["john", 0],
      ["ivan", 0],
      ["maria", 1],
      ["elena", 0],
      ["sofia", 0],
      ["emma", 1],
    ],
    commentUsers: ["john", "maria", "sofia"],
  },
  {
    groupKey: "dance",
    title: "Latin Dance Practice",
    dateOffset: 3,
    time: "18:30",
    location: "Dance Studio 21",
    capacity: 16,
    canceled: false,
    description: "Practice session focused on salsa and bachata steps.",
    participants: [
      ["john", 0],
      ["ivan", 0],
      ["maria", 1],
      ["elena", 0],
      ["george", 0],
    ],
    commentUsers: ["john", "elena", "luka"],
  },
  {
    groupKey: "dance",
    title: "Social Dance Evening",
    dateOffset: 8,
    time: "20:00",
    location: "Community Hall",
    capacity: null,
    canceled: false,
    description: "Informal dance evening for group members and guests, without a fixed participant limit.",
    participants: [
      ["stefan", 0],
      ["maria", 0],
      ["elena", 1],
      ["sofia", 0],
      ["vera", 1],
    ],
    commentUsers: ["george", "emma", "vera"],
  },
  {
    groupKey: "hiking",
    title: "Riverside Nature Walk",
    dateOffset: -11,
    time: "09:00",
    location: "North Riverside Path",
    capacity: null,
    canceled: false,
    description: "Past easy walk along the riverside path with a coffee stop.",
    participants: [
      ["tom", 0],
      ["ivan", 0],
      ["stefan", 0],
      ["george", 1],
      ["mila", 0],
      ["mark", 0],
    ],
    commentUsers: ["stefan", "george", "mila"],
  },
  {
    groupKey: "hiking",
    title: "Forest Trail Hike",
    dateOffset: 4,
    time: "09:00",
    location: "Green Valley Trail",
    capacity: 14,
    canceled: false,
    description: "Easy weekend hike suitable for beginners.",
    participants: [
      ["tom", 0],
      ["ivan", 1],
      ["stefan", 0],
      ["george", 0],
      ["nick", 0],
    ],
    commentUsers: ["ivan", "nick", "daniel"],
  },
  {
    groupKey: "hiking",
    title: "Mountain View Hike",
    dateOffset: 10,
    time: "08:00",
    location: "Eagle Peak Route",
    capacity: 12,
    canceled: false,
    description: "Medium difficulty hike with a picnic break at the viewpoint.",
    participants: [
      ["stefan", 0],
      ["george", 0],
      ["boris", 1],
      ["daniel", 0],
      ["luka", 0],
    ],
    commentUsers: ["stefan", "boris", "mark"],
  },
  {
    groupKey: "puzzle",
    title: "Speed Puzzle Meetup",
    dateOffset: -6,
    time: "17:30",
    location: "Community Games Room",
    capacity: 10,
    canceled: false,
    description: "Past speed puzzle evening with short team rounds.",
    participants: [
      ["peter", 0],
      ["john", 0],
      ["anna", 0],
      ["alex", 1],
      ["nora", 0],
      ["mark", 0],
    ],
    commentUsers: ["peter", "anna", "nora"],
  },
  {
    groupKey: "puzzle",
    title: "Team Puzzle Evening",
    dateOffset: 5,
    time: "18:00",
    location: "Puzzle Cafe",
    capacity: 8,
    canceled: false,
    description: "Team puzzle solving evening with several 500-piece puzzles.",
    participants: [
      ["peter", 0],
      ["john", 0],
      ["anna", 0],
      ["alex", 1],
      ["boris", 0],
    ],
    commentUsers: ["john", "alex", "sofia"],
  },
  {
    groupKey: "puzzle",
    title: "1000-Piece Puzzle Challenge",
    dateOffset: 12,
    time: "16:00",
    location: "Community Games Room",
    capacity: null,
    canceled: false,
    description: "Open puzzle challenge without a fixed participant limit.",
    participants: [
      ["anna", 0],
      ["daniel", 0],
      ["nora", 1],
      ["emma", 0],
      ["mark", 0],
    ],
    commentUsers: ["peter", "daniel", "emma"],
  },
];

const invitesSeed = {
  swimming: [
    ["pending", "john", "tom", 7],
    ["accepted", "peter", "maria", 14],
    ["expired", "stefan", "tom", -3],
    ["revoked", "george", "maria", 5],
  ],
  dance: [
    ["pending", "anna", "john", 7],
    ["accepted", "ivan", "elena", 14],
    ["expired", "nick", "john", -4],
    ["revoked", "boris", "elena", 5],
  ],
  hiking: [
    ["pending", "peter", "stefan", 7],
    ["accepted", "tom", "george", 14],
    ["expired", "maria", "stefan", -2],
    ["revoked", "anna", "george", 5],
  ],
  puzzle: [
    ["pending", "tom", "peter", 7],
    ["accepted", "john", "anna", 14],
    ["expired", "ivan", "peter", -5],
    ["revoked", "maria", "anna", 5],
  ],
};

async function main() {
  console.log("Seeding Eventor sample data...");

  await clearSampleData();

  const passwordHash = await bcrypt.hash("pass123", 10);
  const userIds = await seedUsers(passwordHash);
  const groupIds = await seedGroups(userIds);
  await seedEvents(userIds, groupIds);
  await seedInvites(userIds, groupIds);

  const report = await verifySeed();
  printReport(report);
}

async function clearSampleData() {
  const groupTitles = groupsSeed.map((group) => group.title);

  await sql.query("DELETE FROM group_invites WHERE invite_token LIKE 'seed-%'");
  await sql.query("DELETE FROM groups WHERE title = ANY($1)", [groupTitles]);
}

async function seedUsers(passwordHash) {
  const userIds = new Map();

  for (const user of sampleUsers) {
    const rows = await sql.query(
      `INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, 'user', now(), now())
       ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           updated_at = now()
       RETURNING id`,
      [user.email, passwordHash, user.name],
    );

    userIds.set(user.key, rows[0].id);
  }

  return userIds;
}

async function seedGroups(userIds) {
  const groupIds = new Map();

  for (const group of groupsSeed) {
    const managerId = userIds.get(group.managers[0]);
    const rows = await sql.query(
      `INSERT INTO groups (title, description, created_by_user_id, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       RETURNING id`,
      [group.title, group.description, managerId],
    );

    const groupId = rows[0].id;
    groupIds.set(group.key, groupId);

    for (const memberKey of group.members) {
      await sql.query(
        `INSERT INTO group_members (group_id, user_id, is_manager, joined_at)
         VALUES ($1, $2, $3, now())`,
        [groupId, userIds.get(memberKey), group.managers.includes(memberKey)],
      );
    }
  }

  return groupIds;
}

async function seedEvents(userIds, groupIds) {
  for (const [index, event] of eventsSeed.entries()) {
    const group = groupsSeed.find((item) => item.key === event.groupKey);
    const creatorKey = group.managers[index % group.managers.length];
    const eventDate = dateWithOffset(event.dateOffset);

    const rows = await sql.query(
      `INSERT INTO events (
         group_id, title, description, event_date, event_time, location, capacity,
         canceled, created_by_user_id, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
       RETURNING id`,
      [
        groupIds.get(event.groupKey),
        event.title,
        event.description,
        eventDate,
        event.time,
        event.location,
        event.capacity,
        event.canceled,
        userIds.get(creatorKey),
      ],
    );

    const eventId = rows[0].id;

    for (const [participantKey, extraSlots] of event.participants) {
      assertGroupMember(event.groupKey, participantKey);

      await sql.query(
        `INSERT INTO event_participants (event_id, user_id, status, extra_slots, joined_at)
         VALUES ($1, $2, 'going', $3, now())`,
        [eventId, userIds.get(participantKey), extraSlots],
      );
    }

    for (const [commentIndex, userKey] of event.commentUsers.entries()) {
      assertGroupMember(event.groupKey, userKey);

      await sql.query(
        `INSERT INTO event_comments (event_id, user_id, text, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())`,
        [eventId, userIds.get(userKey), comments[(index + commentIndex) % comments.length]],
      );
    }
  }
}

async function seedInvites(userIds, groupIds) {
  for (const group of groupsSeed) {
    const rows = invitesSeed[group.key];

    for (const [status, invitedKey, createdByKey, expiresOffset] of rows) {
      const acceptedAt = status === "accepted" ? timestampWithOffset(-2) : null;
      const revokedAt = status === "revoked" ? timestampWithOffset(-1) : null;
      const isActive = status === "pending";

      if (status === "accepted" && !group.members.includes(invitedKey)) {
        throw new Error(`Accepted invite for ${invitedKey} must point to a ${group.title} member.`);
      }

      await sql.query(
        `INSERT INTO group_invites (
           group_id, created_by_user_id, invited_user_id, invite_token, status,
           is_active, expires_at, accepted_at, revoked_at, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
        [
          groupIds.get(group.key),
          userIds.get(createdByKey),
          userIds.get(invitedKey),
          `seed-${group.key}-${status}-${invitedKey}`,
          status,
          isActive,
          timestampWithOffset(expiresOffset),
          acceptedAt,
          revokedAt,
        ],
      );
    }
  }
}

async function verifySeed() {
  const emails = sampleUsers.map((user) => user.email);
  const titles = groupsSeed.map((group) => group.title);

  const [usersCount] = await sql.query("SELECT count(*)::int AS count FROM users WHERE email = ANY($1)", [emails]);
  const [groupsCount] = await sql.query("SELECT count(*)::int AS count FROM groups WHERE title = ANY($1)", [titles]);
  const groupDetails = await sql.query(
    `SELECT
       g.title,
       count(DISTINCT gm.id)::int AS members,
       count(DISTINCT gm.id) FILTER (WHERE gm.is_manager)::int AS managers,
       count(DISTINCT e.id) FILTER (WHERE e.event_date >= current_date)::int AS upcoming_events,
       count(DISTINCT e.id) FILTER (WHERE e.event_date < current_date)::int AS past_events
     FROM groups g
     LEFT JOIN group_members gm ON gm.group_id = g.id
     LEFT JOIN events e ON e.group_id = g.id
     WHERE g.title = ANY($1)
     GROUP BY g.id, g.title
     ORDER BY g.title`,
    [titles],
  );
  const eventDetails = await sql.query(
    `SELECT
       e.title,
       g.title AS group_title,
       e.capacity,
       count(DISTINCT ep.id)::int AS joined_users,
       coalesce((SELECT sum(ep2.extra_slots) FROM event_participants ep2 WHERE ep2.event_id = e.id), 0)::int AS extra_slots,
       (
         count(DISTINCT ep.id) +
         coalesce((SELECT sum(ep3.extra_slots) FROM event_participants ep3 WHERE ep3.event_id = e.id), 0)
       )::int AS reserved_slots,
       count(DISTINCT ec.id)::int AS comments
     FROM events e
     JOIN groups g ON g.id = e.group_id
     LEFT JOIN event_participants ep ON ep.event_id = e.id
     LEFT JOIN event_comments ec ON ec.event_id = e.id
     WHERE g.title = ANY($1)
     GROUP BY e.id, e.title, g.title, e.capacity
     ORDER BY g.title, e.event_date, e.event_time`,
    [titles],
  );
  const inviteStatuses = await sql.query(
    `SELECT status, count(*)::int AS count
     FROM group_invites
     WHERE invite_token LIKE 'seed-%'
     GROUP BY status
     ORDER BY status`,
  );

  return {
    users: usersCount.count,
    groups: groupsCount.count,
    groupDetails,
    eventDetails,
    inviteStatuses,
  };
}

function printReport(report) {
  console.log(`Users: ${report.users}`);
  console.log(`Groups: ${report.groups}`);
  console.table(report.groupDetails);
  console.table(report.eventDetails);
  console.table(report.inviteStatuses);
  console.log("Seed data ready.");
}

function assertGroupMember(groupKey, userKey) {
  const group = groupsSeed.find((item) => item.key === groupKey);

  if (!group.members.includes(userKey)) {
    throw new Error(`${userKey} is not a member of ${group.title}.`);
  }
}

function dateWithOffset(offsetDays) {
  const date = addDays(new Date(), offsetDays);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function timestampWithOffset(offsetDays) {
  return addDays(new Date(), offsetDays).toISOString();
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDisplayName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
