import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
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

export type DashboardEvent = {
  id: number;
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
};

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  groupTitle: string;
  eventDate: string;
  eventTime: string;
  location: string | null;
  capacity: number | null;
  canceled: boolean;
};

export async function getUserDashboardEvents(userId: number) {
  const eventRows = await getUserEventRows(userId);
  const eventsWithStats = await hydrateEvents(eventRows);

  return {
    activeEvents: eventsWithStats
      .filter((event) => event.isActive)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    archiveEvents: eventsWithStats
      .filter((event) => !event.isActive)
      .sort((a, b) => b.startAt.getTime() - a.startAt.getTime()),
  };
}

export async function getUserEventById(userId: number, eventId: number) {
  const eventRows = await getUserEventRows(userId, eventId);
  const [event] = await hydrateEvents(eventRows);

  return event ?? null;
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

async function hydrateEvents(eventRows: EventRow[]): Promise<DashboardEvent[]> {
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
  const now = new Date();

  return eventRows.map((event) => {
    const startAt = getEventStartAt(event.eventDate, event.eventTime);
    const timeState = getEventTimeState(startAt, now);
    const attendeeCount = attendeeCountByEvent.get(event.id) ?? 0;
    const capacityState = getEventCapacityState(event.capacity, attendeeCount);

    return {
      ...event,
      startAt,
      timeState,
      capacityState,
      isActive: !event.canceled && (timeState === "upcoming" || timeState === "current"),
      participantCount: participantsByEvent.get(event.id)?.length ?? 0,
      attendeeCount,
      commentsCount: commentsCountByEvent.get(event.id) ?? 0,
      participants: participantsByEvent.get(event.id) ?? [],
    };
  });
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
