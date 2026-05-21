import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashPassword } from "@/lib/auth/password";
import {
  eventComments,
  eventParticipants,
  events,
  groupMembers,
  groups,
  users,
} from "@/db/schema";
import * as schema from "@/db/schema";
import { getSafeTestDatabaseUrl } from "./env";

export type IntegrationSeed = Awaited<ReturnType<typeof resetAndSeedTestDb>>;

export async function resetAndSeedTestDb() {
  const db = getIntegrationDb();

  await truncateApplicationTables();

  const passwordHash = await hashPassword("Password123!");
  const [manager, member, outside] = await db
    .insert(users)
    .values([
      {
        email: "manager.integration@example.com",
        name: "Integration Manager",
        passwordHash,
      },
      {
        email: "member.integration@example.com",
        name: "Integration Member",
        passwordHash,
      },
      {
        email: "outside.integration@example.com",
        name: "Integration Outside",
        passwordHash,
      },
    ])
    .returning({ id: users.id, email: users.email, name: users.name });

  const [primaryGroup, outsideGroup] = await db
    .insert(groups)
    .values([
      {
        title: "Integration Hiking Group",
        description: "Primary integration test group",
        createdByUserId: manager.id,
      },
      {
        title: "Outside Integration Group",
        description: "Group outside the primary users",
        createdByUserId: outside.id,
      },
    ])
    .returning({ id: groups.id, title: groups.title });

  await db.insert(groupMembers).values([
    { groupId: primaryGroup.id, userId: manager.id, isManager: true },
    { groupId: primaryGroup.id, userId: member.id, isManager: false },
    { groupId: outsideGroup.id, userId: outside.id, isManager: true },
  ]);

  const [activeEvent, fullEvent, canceledEvent, pastEvent, outsideEvent] = await db
    .insert(events)
    .values([
      {
        groupId: primaryGroup.id,
        title: "Integration Active Event",
        description: "Upcoming event with room to join",
        eventDate: "2099-01-10",
        eventTime: "10:00:00",
        location: "Test Trail",
        capacity: 3,
        canceled: false,
        createdByUserId: manager.id,
      },
      {
        groupId: primaryGroup.id,
        title: "Integration Full Event",
        description: "Upcoming event with full capacity",
        eventDate: "2099-01-11",
        eventTime: "10:00:00",
        location: "Small Room",
        capacity: 1,
        canceled: false,
        createdByUserId: manager.id,
      },
      {
        groupId: primaryGroup.id,
        title: "Integration Canceled Event",
        description: "Canceled future event",
        eventDate: "2099-01-12",
        eventTime: "10:00:00",
        location: "Canceled Place",
        capacity: 10,
        canceled: true,
        createdByUserId: manager.id,
      },
      {
        groupId: primaryGroup.id,
        title: "Integration Past Event",
        description: "Past event",
        eventDate: "2000-01-10",
        eventTime: "10:00:00",
        location: "Old Trail",
        capacity: 10,
        canceled: false,
        createdByUserId: manager.id,
      },
      {
        groupId: outsideGroup.id,
        title: "Integration Outside Event",
        description: "Event hidden from primary group members",
        eventDate: "2099-01-13",
        eventTime: "10:00:00",
        location: "Outside Venue",
        capacity: 10,
        canceled: false,
        createdByUserId: outside.id,
      },
    ])
    .returning({ id: events.id, title: events.title });

  await db.insert(eventParticipants).values({
    eventId: fullEvent.id,
    userId: manager.id,
    status: "going",
    extraSlots: 0,
  });

  await db.insert(eventComments).values({
    eventId: activeEvent.id,
    userId: manager.id,
    text: "Seeded integration comment",
  });

  return {
    users: { manager, member, outside },
    groups: { primary: primaryGroup, outside: outsideGroup },
    events: { active: activeEvent, full: fullEvent, canceled: canceledEvent, past: pastEvent, outside: outsideEvent },
    password: "Password123!",
  };
}

export async function truncateApplicationTables() {
  const sql = neon(getSafeTestDatabaseUrl());

  await sql.query(`
    truncate table
      event_notifications,
      event_comments,
      event_participants,
      events,
      group_invites,
      group_members,
      groups,
      users
    restart identity cascade
  `);
}

export function getIntegrationDb() {
  const sql = neon(getSafeTestDatabaseUrl());

  return drizzle(sql, { schema });
}
