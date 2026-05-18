import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  eventComments,
  eventParticipants,
  events,
  groupMembers,
  groups,
  users,
} from "@/db/schema";

export type EventTimeState = "upcoming" | "current" | "past";
export type EventCapacityState =
  | "unlimited"
  | "under_capacity"
  | "full_capacity"
  | "over_capacity";

export type DashboardEventParticipant = {
  id: number;
  name: string;
  email: string;
  extraSlots: number;
};

export type DashboardGroup = {
  id: number;
  title: string;
  slug: string;
};

export type EventComment = {
  id: number;
  text: string;
  createdAt: Date;
  authorName: string;
};

export type DashboardEvent = {
  id: number;
  groupId: number;
  groupSlug: string;
  title: string;
  description: string | null;
  groupTitle: string;
  eventDate: string;
  eventTime: string;
  startAt: Date;
  location: string | null;
  capacity: number | null;
  canceled: boolean;
  timeState: EventTimeState;
  capacityState: EventCapacityState;
  isActive: boolean;
  participantCount: number;
  attendeeCount: number;
  commentsCount: number;
  participants: DashboardEventParticipant[];
  comments: EventComment[];
  currentUserParticipation: {
    joined: boolean;
    extraSlots: number;
  };
};

type EventRow = {
  id: number;
  groupId: number;
  title: string;
  description: string | null;
  groupTitle: string;
  eventDate: string;
  eventTime: string;
  location: string | null;
  capacity: number | null;
  canceled: boolean;
};

export type EventAccessResult =
  | { ok: true; event: DashboardEvent }
  | { ok: false; reason: "not_found" | "not_member" };

export type EventMutationResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function getUserDashboardEvents(userId: number) {
  const [userGroups, eventRows] = await Promise.all([
    getUserDashboardGroups(userId),
    getUserEventRows(userId),
  ]);
  const eventsWithStats = await hydrateEvents(eventRows, userId);

  return {
    groups: userGroups,
    activeEvents: eventsWithStats
      .filter((event) => event.isActive)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    archiveEvents: eventsWithStats
      .filter((event) => !event.isActive)
      .sort((a, b) => b.startAt.getTime() - a.startAt.getTime()),
  };
}

export async function getUserDashboardGroups(userId: number): Promise<DashboardGroup[]> {
  const userGroups = await db
    .select({
      id: groups.id,
      title: groups.title,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, userId));

  return userGroups
    .map((group) => ({
      ...group,
      slug: slugify(group.title),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getUserEventById(userId: number, eventId: number) {
  const eventAccess = await getUserEventAccess(userId, eventId);

  if (!eventAccess.ok) {
    return null;
  }

  return eventAccess.event;
}

export async function getUserEventAccess(
  userId: number,
  eventId: number,
): Promise<EventAccessResult> {
  const [eventRow] = await getEventRowsById(eventId);

  if (!eventRow) {
    return { ok: false, reason: "not_found" };
  }

  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, eventRow.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) {
    return { ok: false, reason: "not_member" };
  }

  const [event] = await hydrateEvents([eventRow], userId);

  if (!event) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, event };
}

export async function joinEvent(
  userId: number,
  eventId: number,
): Promise<EventMutationResult> {
  const access = await getUserEventAccess(userId, eventId);

  if (!access.ok) {
    return access.reason === "not_member"
      ? { ok: false, message: "You are not a member of this event group." }
      : { ok: false, message: "Event not found." };
  }

  const { event } = access;

  if (!event.isActive) {
    return { ok: false, message: "This event is not open to join." };
  }

  if (event.currentUserParticipation.joined) {
    return { ok: true, message: "You are already joined." };
  }

  if (event.capacity !== null && event.attendeeCount + 1 > event.capacity) {
    return { ok: false, message: "This event is already at full capacity." };
  }

  await db
    .insert(eventParticipants)
    .values({
      eventId,
      userId,
      status: "going",
      extraSlots: 0,
      joinedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [eventParticipants.eventId, eventParticipants.userId],
      set: {
        status: "going",
        extraSlots: 0,
        joinedAt: new Date(),
      },
    });

  return { ok: true, message: "Joined event." };
}

export async function leaveEvent(
  userId: number,
  eventId: number,
): Promise<EventMutationResult> {
  const access = await getUserEventAccess(userId, eventId);

  if (!access.ok) {
    return access.reason === "not_member"
      ? { ok: false, message: "You are not a member of this event group." }
      : { ok: false, message: "Event not found." };
  }

  if (!access.event.currentUserParticipation.joined) {
    return { ok: true, message: "You are not joined." };
  }

  await db
    .update(eventParticipants)
    .set({ status: "not_going", extraSlots: 0 })
    .where(
      and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.userId, userId),
      ),
    );

  return { ok: true, message: "Left event." };
}

export async function updateEventExtraSlots(
  userId: number,
  eventId: number,
  extraSlots: number,
): Promise<EventMutationResult> {
  const access = await getUserEventAccess(userId, eventId);

  if (!access.ok) {
    return access.reason === "not_member"
      ? { ok: false, message: "You are not a member of this event group." }
      : { ok: false, message: "Event not found." };
  }

  const { event } = access;

  if (!event.isActive) {
    return { ok: false, message: "This event is not open for reservation changes." };
  }

  if (!event.currentUserParticipation.joined) {
    return { ok: false, message: "Join the event before reserving extra slots." };
  }

  const normalizedExtraSlots = Number.isFinite(extraSlots)
    ? Math.max(0, Math.min(20, Math.floor(extraSlots)))
    : 0;
  const currentUserSlots = 1 + event.currentUserParticipation.extraSlots;
  const requestedUserSlots = 1 + normalizedExtraSlots;
  const attendeeCountAfterChange =
    event.attendeeCount - currentUserSlots + requestedUserSlots;

  if (event.capacity !== null && attendeeCountAfterChange > event.capacity) {
    return {
      ok: false,
      message: "There is not enough remaining capacity for those extra slots.",
    };
  }

  await db
    .update(eventParticipants)
    .set({ extraSlots: normalizedExtraSlots })
    .where(
      and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.userId, userId),
        eq(eventParticipants.status, "going"),
      ),
    );

  return { ok: true, message: "Reserved slots updated." };
}

export function getCapacityLabel(event: Pick<DashboardEvent, "capacity" | "capacityState">) {
  switch (event.capacityState) {
    case "unlimited":
      return "unlimited capacity";
    case "full_capacity":
      return "full capacity";
    case "over_capacity":
      return "over capacity";
    case "under_capacity":
      return "under capacity";
  }
}

async function getUserEventRows(userId: number, eventId?: number): Promise<EventRow[]> {
  const memberships = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));

  const groupIds = memberships.map((membership) => membership.groupId);

  if (groupIds.length === 0) {
    return [];
  }

  const filters = [inArray(events.groupId, groupIds)];

  if (eventId !== undefined) {
    filters.push(eq(events.id, eventId));
  }

  return db
    .select({
      id: events.id,
      groupId: events.groupId,
      title: events.title,
      description: events.description,
      groupTitle: groups.title,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      location: events.location,
      capacity: events.capacity,
      canceled: events.canceled,
    })
    .from(events)
    .innerJoin(groups, eq(events.groupId, groups.id))
    .where(and(...filters));
}

async function getEventRowsById(eventId: number): Promise<EventRow[]> {
  return db
    .select({
      id: events.id,
      groupId: events.groupId,
      title: events.title,
      description: events.description,
      groupTitle: groups.title,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      location: events.location,
      capacity: events.capacity,
      canceled: events.canceled,
    })
    .from(events)
    .innerJoin(groups, eq(events.groupId, groups.id))
    .where(eq(events.id, eventId))
    .limit(1);
}

async function hydrateEvents(
  eventRows: EventRow[],
  currentUserId: number,
): Promise<DashboardEvent[]> {
  const eventIds = eventRows.map((event) => event.id);

  if (eventIds.length === 0) {
    return [];
  }

  const participantRows = await db
    .select({
      eventId: eventParticipants.eventId,
      userId: users.id,
      name: users.name,
      email: users.email,
      extraSlots: eventParticipants.extraSlots,
      joinedAt: eventParticipants.joinedAt,
    })
    .from(eventParticipants)
    .innerJoin(users, eq(eventParticipants.userId, users.id))
    .where(
      and(
        inArray(eventParticipants.eventId, eventIds),
        eq(eventParticipants.status, "going"),
      ),
    );

  const commentRows = await db
    .select({
      eventId: eventComments.eventId,
      commentsCount: sql<number>`count(*)::int`,
    })
    .from(eventComments)
    .where(inArray(eventComments.eventId, eventIds))
    .groupBy(eventComments.eventId);

  const commentDetailRows = await db
    .select({
      id: eventComments.id,
      eventId: eventComments.eventId,
      text: eventComments.text,
      createdAt: eventComments.createdAt,
      authorName: users.name,
    })
    .from(eventComments)
    .innerJoin(users, eq(eventComments.userId, users.id))
    .where(inArray(eventComments.eventId, eventIds))
    .orderBy(desc(eventComments.createdAt));

  const participantsByEvent = new Map<number, DashboardEventParticipant[]>();
  const attendeeCountByEvent = new Map<number, number>();

  for (const participant of participantRows) {
    const eventParticipantsList = participantsByEvent.get(participant.eventId) ?? [];
    eventParticipantsList.push({
      id: participant.userId,
      name: participant.name,
      email: participant.email,
      extraSlots: participant.extraSlots,
    });
    participantsByEvent.set(participant.eventId, eventParticipantsList);
    attendeeCountByEvent.set(
      participant.eventId,
      (attendeeCountByEvent.get(participant.eventId) ?? 0) + 1 + participant.extraSlots,
    );
  }

  for (const participants of participantsByEvent.values()) {
    participants.sort((a, b) => a.name.localeCompare(b.name));
  }

  const commentsCountByEvent = new Map(
    commentRows.map((comment) => [comment.eventId, comment.commentsCount]),
  );
  const commentsByEvent = new Map<number, EventComment[]>();

  for (const comment of commentDetailRows) {
    const comments = commentsByEvent.get(comment.eventId) ?? [];
    comments.push({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      authorName: comment.authorName,
    });
    commentsByEvent.set(comment.eventId, comments);
  }

  const now = new Date();

  return eventRows.map((event) => {
    const startAt = getEventStartAt(event.eventDate, event.eventTime);
    const timeState = getEventTimeState(startAt, now);
    const attendeeCount = attendeeCountByEvent.get(event.id) ?? 0;
    const capacityState = getEventCapacityState(event.capacity, attendeeCount);

    const currentUserParticipant = participantsByEvent
      .get(event.id)
      ?.find((participant) => participant.id === currentUserId);

    return {
      ...event,
      groupSlug: slugify(event.groupTitle),
      startAt,
      timeState,
      capacityState,
      isActive: !event.canceled && (timeState === "upcoming" || timeState === "current"),
      participantCount: participantsByEvent.get(event.id)?.length ?? 0,
      attendeeCount,
      commentsCount: commentsCountByEvent.get(event.id) ?? 0,
      participants: participantsByEvent.get(event.id) ?? [],
      comments: commentsByEvent.get(event.id) ?? [],
      currentUserParticipation: {
        joined: currentUserParticipant !== undefined,
        extraSlots: currentUserParticipant?.extraSlots ?? 0,
      },
    };
  });
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getEventStartAt(eventDate: string, eventTime: string) {
  const timeWithoutFraction = eventTime.split(".")[0] ?? eventTime;
  const normalizedTime =
    timeWithoutFraction.length === 5 ? `${timeWithoutFraction}:00` : timeWithoutFraction;

  return new Date(`${eventDate}T${normalizedTime}`);
}

function getEventTimeState(startAt: Date, now: Date): EventTimeState {
  const startTime = startAt.getTime();
  const fallbackEndTime = startTime + 60 * 60 * 1000;
  const nowTime = now.getTime();

  if (nowTime < startTime) {
    return "upcoming";
  }

  if (nowTime < fallbackEndTime) {
    return "current";
  }

  return "past";
}

function getEventCapacityState(
  capacity: number | null,
  attendeeCount: number,
): EventCapacityState {
  if (capacity === null) {
    return "unlimited";
  }

  if (attendeeCount > capacity) {
    return "over_capacity";
  }

  if (attendeeCount === capacity) {
    return "full_capacity";
  }

  return "under_capacity";
}
