import "server-only";

import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
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
  userId: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
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
  currentUserCanManageGroup: boolean;
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

export type EventManagementDetails = {
  id: number;
  groupId: number;
  groupTitle: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string;
  location: string | null;
  capacity: number | null;
  canceled: boolean;
};

export type EventManagementAccessResult =
  | { ok: true; event: EventManagementDetails }
  | { ok: false; reason: "not_found" | "not_member" | "not_manager" };

export type EventManagementMutationResult =
  | { ok: true; message: string; eventId?: number }
  | { ok: false; message: string };

export type PagedEventsResult = {
  events: DashboardEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DashboardEventsPageInput = {
  view?: "active" | "archive";
  groupId?: number;
  page?: number;
  pageSize?: number;
};

export type DashboardEventsPageResult = PagedEventsResult & {
  groups: DashboardGroup[];
  countsByGroup: Map<string, number>;
  allCount: number;
};

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

export async function getUserActiveEventsPage(
  userId: number,
  input: { page?: number; pageSize?: number } = {},
): Promise<PagedEventsResult> {
  const result = await getUserDashboardEventsPage(userId, {
    view: "active",
    page: input.page,
    pageSize: input.pageSize,
  });

  return {
    events: result.events,
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  };
}

export async function getUserDashboardEventsPage(
  userId: number,
  input: DashboardEventsPageInput = {},
): Promise<DashboardEventsPageResult> {
  const view = input.view ?? "active";
  const page = normalizePositiveInteger(input.page, 1);
  const pageSize = Math.min(normalizePositiveInteger(input.pageSize, 10), 50);
  const offset = (page - 1) * pageSize;
  const userGroups = await getUserDashboardGroups(userId);

  if (userGroups.length === 0) {
    return {
      groups: [],
      events: [],
      countsByGroup: new Map(),
      allCount: 0,
      page,
      pageSize,
      total: 0,
      totalPages: 1,
    };
  }

  const viewFilter = getDashboardViewFilter(view);
  const baseFilters = [
    eq(groupMembers.userId, userId),
    viewFilter,
  ];

  const groupScopedFilters =
    input.groupId === undefined
      ? baseFilters
      : [...baseFilters, eq(events.groupId, input.groupId)];

  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(events)
    .innerJoin(groupMembers, eq(groupMembers.groupId, events.groupId))
    .where(and(...groupScopedFilters));

  const countRows = await db
    .select({
      groupId: events.groupId,
      groupTitle: groups.title,
      total: sql<number>`count(*)::int`,
    })
    .from(events)
    .innerJoin(groups, eq(events.groupId, groups.id))
    .innerJoin(groupMembers, eq(groupMembers.groupId, events.groupId))
    .where(and(...baseFilters))
    .groupBy(events.groupId, groups.title);

  const total = totalRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const orderBy = getDashboardViewOrder(view);
  const eventRows = await db
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
    .innerJoin(groupMembers, eq(groupMembers.groupId, events.groupId))
    .where(and(...groupScopedFilters))
    .orderBy(orderBy, events.id)
    .limit(pageSize)
    .offset(offset);
  const pagedEvents = await hydrateEvents(eventRows, userId);
  const sortedEvents = pagedEvents.sort((a, b) =>
    view === "active"
      ? a.startAt.getTime() - b.startAt.getTime()
      : b.startAt.getTime() - a.startAt.getTime(),
  );
  const countsByGroup = new Map(
    countRows.map((row) => [slugify(row.groupTitle, row.groupId), row.total]),
  );

  return {
    groups: userGroups,
    events: sortedEvents,
    countsByGroup,
    allCount: countRows.reduce((sum, row) => sum + row.total, 0),
    page,
    pageSize,
    total,
    totalPages,
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
      slug: slugify(group.title, group.id),
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
    .select({ id: groupMembers.id, isManager: groupMembers.isManager })
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

  return {
    ok: true,
    event: { ...event, currentUserCanManageGroup: membership.isManager },
  };
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

export async function getEventManagementAccess(
  userId: number,
  groupId: number,
  eventId: number,
): Promise<EventManagementAccessResult> {
  const [group] = await db
    .select({ id: groups.id, title: groups.title })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    return { ok: false, reason: "not_found" };
  }

  const [event] = await db
    .select({
      id: events.id,
      groupId: events.groupId,
      groupTitle: groups.title,
      title: events.title,
      description: events.description,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      location: events.location,
      capacity: events.capacity,
      canceled: events.canceled,
    })
    .from(events)
    .innerJoin(groups, eq(events.groupId, groups.id))
    .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
    .limit(1);

  if (!event) {
    return { ok: false, reason: "not_found" };
  }

  const [membership] = await db
    .select({ isManager: groupMembers.isManager })
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

  if (!membership.isManager) {
    return { ok: false, reason: "not_manager" };
  }

  return { ok: true, event };
}

export async function createManagedEvent(
  userId: number,
  groupId: number,
  input: EventManagementFormInput,
): Promise<EventManagementMutationResult> {
  const managerAccess = await getGroupManagerAccess(userId, groupId);

  if (!managerAccess.ok) {
    return getEventManagementMutationError(managerAccess.reason);
  }

  const validation = validateEventManagementInput(input);

  if (!validation.ok) {
    return validation;
  }

  const [createdEvent] = await db
    .insert(events)
    .values({
      groupId,
      title: validation.title,
      description: validation.description,
      eventDate: validation.eventDate,
      eventTime: validation.eventTime,
      location: validation.location,
      capacity: validation.capacity,
      canceled: false,
      createdByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: events.id });

  if (!createdEvent) {
    return { ok: false, message: "Event could not be created." };
  }

  return { ok: true, message: "Event created.", eventId: createdEvent.id };
}

export async function updateManagedEvent(
  userId: number,
  groupId: number,
  eventId: number,
  input: EventManagementFormInput,
): Promise<EventManagementMutationResult> {
  const access = await getEventManagementAccess(userId, groupId, eventId);

  if (!access.ok) {
    return getEventManagementMutationError(access.reason);
  }

  const validation = validateEventManagementInput(input);

  if (!validation.ok) {
    return validation;
  }

  await db
    .update(events)
    .set({
      title: validation.title,
      description: validation.description,
      eventDate: validation.eventDate,
      eventTime: validation.eventTime,
      location: validation.location,
      capacity: validation.capacity,
      canceled: validation.canceled,
      updatedAt: new Date(),
    })
    .where(and(eq(events.id, eventId), eq(events.groupId, groupId)));

  return { ok: true, message: "Event updated.", eventId };
}

export async function deleteManagedEvent(
  userId: number,
  groupId: number,
  eventId: number,
): Promise<EventManagementMutationResult> {
  const access = await getEventManagementAccess(userId, groupId, eventId);

  if (!access.ok) {
    return getEventManagementMutationError(access.reason);
  }

  await db
    .delete(events)
    .where(and(eq(events.id, eventId), eq(events.groupId, groupId)));

  return { ok: true, message: "Event deleted." };
}

export async function addEventComment(
  userId: number,
  eventId: number,
  text: string,
): Promise<EventMutationResult> {
  const access = await getUserEventAccess(userId, eventId);

  if (!access.ok) {
    return access.reason === "not_member"
      ? { ok: false, message: "You are not a member of this event group." }
      : { ok: false, message: "Event not found." };
  }

  const validation = validateCommentText(text);

  if (!validation.ok) {
    return validation;
  }

  await db.insert(eventComments).values({
    eventId,
    userId,
    text: validation.text,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { ok: true, message: "Comment added." };
}

export async function updateEventComment(
  userId: number,
  eventId: number,
  commentId: number,
  text: string,
): Promise<EventMutationResult> {
  const access = await getUserEventAccess(userId, eventId);

  if (!access.ok) {
    return access.reason === "not_member"
      ? { ok: false, message: "You are not a member of this event group." }
      : { ok: false, message: "Event not found." };
  }

  const validation = validateCommentText(text);

  if (!validation.ok) {
    return validation;
  }

  const comment = await getEventCommentForMutation(eventId, commentId);

  if (!comment) {
    return { ok: false, message: "Comment not found." };
  }

  if (comment.userId !== userId) {
    return { ok: false, message: "You can only edit your own comments." };
  }

  await db
    .update(eventComments)
    .set({ text: validation.text, updatedAt: new Date() })
    .where(and(eq(eventComments.id, commentId), eq(eventComments.eventId, eventId)));

  return { ok: true, message: "Comment updated." };
}

export async function deleteEventComment(
  userId: number,
  eventId: number,
  commentId: number,
): Promise<EventMutationResult> {
  const access = await getUserEventAccess(userId, eventId);

  if (!access.ok) {
    return access.reason === "not_member"
      ? { ok: false, message: "You are not a member of this event group." }
      : { ok: false, message: "Event not found." };
  }

  const comment = await getEventCommentForMutation(eventId, commentId);

  if (!comment) {
    return { ok: false, message: "Comment not found." };
  }

  const [membership] = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, access.event.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);

  if (comment.userId !== userId && !membership?.isManager) {
    return { ok: false, message: "You can only delete comments you own." };
  }

  await db
    .delete(eventComments)
    .where(and(eq(eventComments.id, commentId), eq(eventComments.eventId, eventId)));

  return { ok: true, message: "Comment deleted." };
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
      userId: eventComments.userId,
      text: eventComments.text,
      createdAt: eventComments.createdAt,
      updatedAt: eventComments.updatedAt,
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
      userId: comment.userId,
      text: comment.text,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
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
      groupSlug: slugify(event.groupTitle, event.groupId),
      startAt,
      timeState,
      capacityState,
      isActive: !event.canceled && (timeState === "upcoming" || timeState === "current"),
      participantCount: participantsByEvent.get(event.id)?.length ?? 0,
      attendeeCount,
      commentsCount: commentsCountByEvent.get(event.id) ?? 0,
      participants: participantsByEvent.get(event.id) ?? [],
      comments: commentsByEvent.get(event.id) ?? [],
      currentUserCanManageGroup: false,
      currentUserParticipation: {
        joined: currentUserParticipant !== undefined,
        extraSlots: currentUserParticipant?.extraSlots ?? 0,
      },
    };
  });
}

function getDashboardViewFilter(view: "active" | "archive") {
  const activeFilter = and(
    eq(events.canceled, false),
    sql<boolean>`(${events.eventDate} + ${events.eventTime}) >= now() - interval '1 hour'`,
  );

  if (view === "active") {
    return activeFilter;
  }

  return or(
    eq(events.canceled, true),
    sql<boolean>`(${events.eventDate} + ${events.eventTime}) < now() - interval '1 hour'`,
  );
}

function getDashboardViewOrder(view: "active" | "archive") {
  const startAtExpression = sql`${events.eventDate} + ${events.eventTime}`;

  return view === "active" ? asc(startAtExpression) : desc(startAtExpression);
}

async function getEventCommentForMutation(eventId: number, commentId: number) {
  const [comment] = await db
    .select({
      id: eventComments.id,
      eventId: eventComments.eventId,
      userId: eventComments.userId,
    })
    .from(eventComments)
    .where(and(eq(eventComments.id, commentId), eq(eventComments.eventId, eventId)))
    .limit(1);

  return comment;
}

type EventManagementFormInput = {
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  location: string;
  capacity: string;
  canceled?: boolean;
};

async function getGroupManagerAccess(userId: number, groupId: number) {
  const [group] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const [membership] = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) {
    return { ok: false as const, reason: "not_member" as const };
  }

  if (!membership.isManager) {
    return { ok: false as const, reason: "not_manager" as const };
  }

  return { ok: true as const };
}

function validateEventManagementInput(
  input: EventManagementFormInput,
):
  | {
      ok: true;
      title: string;
      description: string | null;
      eventDate: string;
      eventTime: string;
      location: string | null;
      capacity: number | null;
      canceled: boolean;
    }
  | { ok: false; message: string } {
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  const eventDate = input.eventDate.trim();
  const eventTime = input.eventTime.trim();
  const capacity = input.capacity.trim();

  if (title.length === 0) {
    return { ok: false, message: "Enter an event title." };
  }

  if (title.length > 180) {
    return { ok: false, message: "Event titles must be 180 characters or less." };
  }

  if (description.length > 2000) {
    return {
      ok: false,
      message: "Event descriptions must be 2000 characters or less.",
    };
  }

  if (!isValidDateInput(eventDate)) {
    return { ok: false, message: "Enter a valid event date." };
  }

  if (!isValidTimeInput(eventTime)) {
    return { ok: false, message: "Enter a valid event time." };
  }

  if (location.length > 240) {
    return { ok: false, message: "Locations must be 240 characters or less." };
  }

  const parsedCapacity = parseCapacityInput(capacity);

  if (!parsedCapacity.ok) {
    return parsedCapacity;
  }

  return {
    ok: true,
    title,
    description: description.length > 0 ? description : null,
    eventDate,
    eventTime,
    location: location.length > 0 ? location : null,
    capacity: parsedCapacity.capacity,
    canceled: input.canceled ?? false,
  };
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTimeInput(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function parseCapacityInput(
  value: string,
): { ok: true; capacity: number | null } | { ok: false; message: string } {
  if (value.length === 0) {
    return { ok: true, capacity: null };
  }

  const capacity = Number(value);

  if (!Number.isInteger(capacity) || capacity < 1) {
    return { ok: false, message: "Capacity must be empty or a positive integer." };
  }

  if (capacity > 100000) {
    return { ok: false, message: "Capacity is too large." };
  }

  return { ok: true, capacity };
}

function getEventManagementMutationError(
  reason: "not_found" | "not_member" | "not_manager",
): EventManagementMutationResult {
  switch (reason) {
    case "not_found":
      return { ok: false, message: "Event not found." };
    case "not_member":
      return { ok: false, message: "You are not a member of this group." };
    case "not_manager":
      return { ok: false, message: "Only group managers can change events." };
  }
}

function validateCommentText(
  text: string,
): { ok: true; text: string } | { ok: false; message: string } {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return { ok: false, message: "Enter a comment before saving." };
  }

  if (trimmedText.length > 1000) {
    return { ok: false, message: "Comments must be 1000 characters or less." };
  }

  return { ok: true, text: trimmedText };
}

function slugify(value: string, id: number) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `${slug}-${id}` : `group-${id}`;
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

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}
