import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  eventParticipants,
  events,
  groupMembers,
  groups,
  users,
} from "@/db/schema";

export type UserGroupSummary = {
  id: number;
  title: string;
  description: string | null;
  memberCount: number;
  activeEventCount: number;
  currentUserIsManager: boolean;
};

export type GroupMemberSummary = {
  id: number;
  name: string;
  email: string;
  isManager: boolean;
  joinedAt: Date;
};

export type GroupEventSummary = {
  id: number;
  title: string;
  startAt: Date;
  location: string | null;
  capacity: number | null;
  participantCount: number;
  attendeeCount: number;
  canceled: boolean;
  isActive: boolean;
};

export type GroupDetails = {
  id: number;
  title: string;
  description: string | null;
  currentUserIsManager: boolean;
  managers: GroupMemberSummary[];
  members: GroupMemberSummary[];
  events: GroupEventSummary[];
};

export type GroupAccessResult =
  | { ok: true; group: GroupDetails }
  | { ok: false; reason: "not_found" | "not_member" };

type GroupEventRow = {
  id: number;
  title: string;
  eventDate: string;
  eventTime: string;
  location: string | null;
  capacity: number | null;
  canceled: boolean;
};

export async function getUserGroups(userId: number): Promise<UserGroupSummary[]> {
  const userGroupRows = await db
    .select({
      id: groups.id,
      title: groups.title,
      description: groups.description,
      currentUserIsManager: groupMembers.isManager,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, userId))
    .orderBy(asc(groups.title));

  if (userGroupRows.length === 0) {
    return [];
  }

  const groupIds = userGroupRows.map((group) => group.id);
  const memberCountRows = await db
    .select({
      groupId: groupMembers.groupId,
      memberCount: sql<number>`count(*)::int`,
    })
    .from(groupMembers)
    .where(inArray(groupMembers.groupId, groupIds))
    .groupBy(groupMembers.groupId);
  const activeEventCountRows = await db
    .select({
      groupId: events.groupId,
      activeEventCount: sql<number>`count(*)::int`,
    })
    .from(events)
    .where(and(inArray(events.groupId, groupIds), getActiveEventFilter()))
    .groupBy(events.groupId);
  const memberCountsByGroup = new Map(
    memberCountRows.map((row) => [row.groupId, row.memberCount]),
  );
  const activeEventCountsByGroup = new Map(
    activeEventCountRows.map((row) => [row.groupId, row.activeEventCount]),
  );

  return userGroupRows.map((group) => ({
    ...group,
    memberCount: memberCountsByGroup.get(group.id) ?? 0,
    activeEventCount: activeEventCountsByGroup.get(group.id) ?? 0,
  }));
}

export async function getUserGroupAccess(
  userId: number,
  groupId: number,
): Promise<GroupAccessResult> {
  const [group] = await db
    .select({
      id: groups.id,
      title: groups.title,
      description: groups.description,
    })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    return { ok: false, reason: "not_found" };
  }

  const [membership] = await db
    .select({
      id: groupMembers.id,
      isManager: groupMembers.isManager,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) {
    return { ok: false, reason: "not_member" };
  }

  const [members, eventRows] = await Promise.all([
    getGroupMembers(groupId),
    getGroupEventRows(groupId),
  ]);
  const eventsWithCounts = await hydrateGroupEvents(eventRows);

  return {
    ok: true,
    group: {
      ...group,
      currentUserIsManager: membership.isManager,
      managers: members.filter((member) => member.isManager),
      members,
      events: eventsWithCounts.sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }

        return a.isActive
          ? a.startAt.getTime() - b.startAt.getTime()
          : b.startAt.getTime() - a.startAt.getTime();
      }),
    },
  };
}

async function getGroupMembers(groupId: number): Promise<GroupMemberSummary[]> {
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isManager: groupMembers.isManager,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(desc(groupMembers.isManager), asc(users.name));

  return members;
}

async function getGroupEventRows(groupId: number): Promise<GroupEventRow[]> {
  return db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      location: events.location,
      capacity: events.capacity,
      canceled: events.canceled,
    })
    .from(events)
    .where(eq(events.groupId, groupId))
    .orderBy(asc(events.eventDate), asc(events.eventTime), asc(events.id));
}

async function hydrateGroupEvents(
  eventRows: GroupEventRow[],
): Promise<GroupEventSummary[]> {
  const eventIds = eventRows.map((event) => event.id);

  if (eventIds.length === 0) {
    return [];
  }

  const participantRows = await db
    .select({
      eventId: eventParticipants.eventId,
      participantCount: sql<number>`count(*)::int`,
      attendeeCount: sql<number>`sum(1 + ${eventParticipants.extraSlots})::int`,
    })
    .from(eventParticipants)
    .where(
      and(
        inArray(eventParticipants.eventId, eventIds),
        eq(eventParticipants.status, "going"),
      ),
    )
    .groupBy(eventParticipants.eventId);
  const participantCountsByEvent = new Map(
    participantRows.map((row) => [row.eventId, row.participantCount]),
  );
  const attendeeCountsByEvent = new Map(
    participantRows.map((row) => [row.eventId, row.attendeeCount]),
  );
  const now = new Date();

  return eventRows.map((event) => {
    const startAt = getEventStartAt(event.eventDate, event.eventTime);
    const isActive =
      !event.canceled && (startAt.getTime() + 60 * 60 * 1000 >= now.getTime());

    return {
      id: event.id,
      title: event.title,
      startAt,
      location: event.location,
      capacity: event.capacity,
      participantCount: participantCountsByEvent.get(event.id) ?? 0,
      attendeeCount: attendeeCountsByEvent.get(event.id) ?? 0,
      canceled: event.canceled,
      isActive,
    };
  });
}

function getActiveEventFilter() {
  return and(
    eq(events.canceled, false),
    sql<boolean>`(${events.eventDate} + ${events.eventTime}) >= now() - interval '1 hour'`,
  );
}

function getEventStartAt(eventDate: string, eventTime: string) {
  const timeWithoutFraction = eventTime.split(".")[0] ?? eventTime;
  const normalizedTime =
    timeWithoutFraction.length === 5 ? `${timeWithoutFraction}:00` : timeWithoutFraction;

  return new Date(`${eventDate}T${normalizedTime}`);
}
