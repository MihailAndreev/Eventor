import "server-only";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  eventComments,
  eventLinks,
  eventParticipants,
  events,
  groupInvites,
  groupMembers,
  groups,
  users,
} from "@/db/schema";

export type AdminRole = "user" | "admin";

export type AdminMutationResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export type AdminPageInput = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type AdminEventsPageInput = AdminPageInput & {
  view?: "active" | "archive";
  canceled?: "all" | "yes" | "no";
};

export type AdminPagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalGroups: number;
  totalEvents: number;
  totalComments: number;
  totalEventLinks: number;
  activeInvites: number;
  pendingInvites: number;
};

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: Date;
  groupsJoinedCount: number;
  groupsManagedCount: number;
};

export type AdminGroupRow = {
  id: number;
  title: string;
  memberCount: number;
  managerCount: number;
  eventCount: number;
  createdAt: Date;
};

export type AdminEventRow = {
  id: number;
  title: string;
  groupId: number;
  groupTitle: string;
  eventDate: string;
  eventTime: string;
  canceled: boolean;
  participantCount: number;
  commentCount: number;
  linkCount: number;
};

export type AdminCommentRow = {
  id: number;
  eventId: number;
  eventTitle: string;
  groupId: number;
  groupTitle: string;
  authorName: string;
  authorEmail: string;
  text: string;
  createdAt: Date;
};

export async function isUserAdmin(userId: number) {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.role === "admin";
}

export async function getAdminDashboardStats(
  actingUserId: number,
): Promise<AdminDashboardStats> {
  await requireAdminUser(actingUserId);

  const [
    userCount,
    groupCount,
    eventCount,
    commentCount,
    linkCount,
    activeInviteCount,
    pendingInviteCount,
  ] = await Promise.all([
    countRows(users),
    countRows(groups),
    countRows(events),
    countRows(eventComments),
    countRows(eventLinks),
    countRows(groupInvites, eq(groupInvites.isActive, true)),
    countRows(groupInvites, eq(groupInvites.status, "pending")),
  ]);

  return {
    totalUsers: userCount,
    totalGroups: groupCount,
    totalEvents: eventCount,
    totalComments: commentCount,
    totalEventLinks: linkCount,
    activeInvites: activeInviteCount,
    pendingInvites: pendingInviteCount,
  };
}

export async function getAdminUsersPage(
  actingUserId: number,
  input: AdminPageInput = {},
): Promise<AdminPagedResult<AdminUserRow>> {
  await requireAdminUser(actingUserId);

  const { page, pageSize, offset } = getPagination(input);
  const search = normalizeSearch(input.search);
  const filters = search
    ? [or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))]
    : [];

  const total = await countRows(users, and(...filters));
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      groupsJoinedCount: sql<number>`count(${groupMembers.id})::int`,
      groupsManagedCount: sql<number>`count(${groupMembers.id}) filter (where ${groupMembers.isManager} = true)::int`,
    })
    .from(users)
    .leftJoin(groupMembers, eq(groupMembers.userId, users.id))
    .where(and(...filters))
    .groupBy(users.id)
    .orderBy(asc(users.name), asc(users.id))
    .limit(pageSize)
    .offset(offset);

  return getPagedResult(rows, page, pageSize, total);
}

export async function getAdminGroupsPage(
  actingUserId: number,
  input: AdminPageInput = {},
): Promise<AdminPagedResult<AdminGroupRow>> {
  await requireAdminUser(actingUserId);

  const { page, pageSize, offset } = getPagination(input);
  const search = normalizeSearch(input.search);
  const filters = search ? [ilike(groups.title, `%${search}%`)] : [];
  const total = await countRows(groups, and(...filters));
  const rows = await db
    .select({
      id: groups.id,
      title: groups.title,
      createdAt: groups.createdAt,
      memberCount: sql<number>`count(distinct ${groupMembers.userId})::int`,
      managerCount: sql<number>`count(distinct ${groupMembers.userId}) filter (where ${groupMembers.isManager} = true)::int`,
      eventCount: sql<number>`count(distinct ${events.id})::int`,
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groupMembers.groupId, groups.id))
    .leftJoin(events, eq(events.groupId, groups.id))
    .where(and(...filters))
    .groupBy(groups.id)
    .orderBy(asc(groups.title), asc(groups.id))
    .limit(pageSize)
    .offset(offset);

  return getPagedResult(rows, page, pageSize, total);
}

export async function getAdminEventsPage(
  actingUserId: number,
  input: AdminEventsPageInput = {},
): Promise<AdminPagedResult<AdminEventRow>> {
  await requireAdminUser(actingUserId);

  const { page, pageSize, offset } = getPagination(input);
  const search = normalizeSearch(input.search);
  const filters = [
    ...getEventViewFilters(input),
    ...(search
      ? [or(ilike(events.title, `%${search}%`), ilike(groups.title, `%${search}%`))]
      : []),
  ];
  const baseFilter = and(...filters);
  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(events)
    .innerJoin(groups, eq(events.groupId, groups.id))
    .where(baseFilter);
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      groupId: groups.id,
      groupTitle: groups.title,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      canceled: events.canceled,
      participantCount: sql<number>`count(distinct ${eventParticipants.id}) filter (where ${eventParticipants.status} = 'going')::int`,
      commentCount: sql<number>`count(distinct ${eventComments.id})::int`,
      linkCount: sql<number>`count(distinct ${eventLinks.id})::int`,
    })
    .from(events)
    .innerJoin(groups, eq(events.groupId, groups.id))
    .leftJoin(eventParticipants, eq(eventParticipants.eventId, events.id))
    .leftJoin(eventComments, eq(eventComments.eventId, events.id))
    .leftJoin(eventLinks, eq(eventLinks.eventId, events.id))
    .where(baseFilter)
    .groupBy(events.id, groups.id)
    .orderBy(desc(sql`${events.eventDate} + ${events.eventTime}`), asc(events.id))
    .limit(pageSize)
    .offset(offset);

  return getPagedResult(rows, page, pageSize, totalRow?.total ?? 0);
}

export async function getAdminCommentsPage(
  actingUserId: number,
  input: AdminPageInput = {},
): Promise<AdminPagedResult<AdminCommentRow>> {
  await requireAdminUser(actingUserId);

  const { page, pageSize, offset } = getPagination(input);
  const search = normalizeSearch(input.search);
  const filters = search
    ? [
        or(
          ilike(eventComments.text, `%${search}%`),
          ilike(events.title, `%${search}%`),
          ilike(groups.title, `%${search}%`),
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
        ),
      ]
    : [];
  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(eventComments)
    .innerJoin(events, eq(eventComments.eventId, events.id))
    .innerJoin(groups, eq(events.groupId, groups.id))
    .innerJoin(users, eq(eventComments.userId, users.id))
    .where(and(...filters));
  const rows = await db
    .select({
      id: eventComments.id,
      eventId: events.id,
      eventTitle: events.title,
      groupId: groups.id,
      groupTitle: groups.title,
      authorName: users.name,
      authorEmail: users.email,
      text: eventComments.text,
      createdAt: eventComments.createdAt,
    })
    .from(eventComments)
    .innerJoin(events, eq(eventComments.eventId, events.id))
    .innerJoin(groups, eq(events.groupId, groups.id))
    .innerJoin(users, eq(eventComments.userId, users.id))
    .where(and(...filters))
    .orderBy(desc(eventComments.createdAt), desc(eventComments.id))
    .limit(pageSize)
    .offset(offset);

  return getPagedResult(rows, page, pageSize, totalRow?.total ?? 0);
}

export async function updateAdminUserRole(
  actingUserId: number,
  targetUserId: number,
  role: AdminRole,
): Promise<AdminMutationResult> {
  await requireAdminUser(actingUserId);

  const [targetUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!targetUser) {
    return { ok: false, message: "User not found." };
  }

  if (targetUser.role === role) {
    return { ok: true, message: "User role unchanged." };
  }

  if (targetUser.role === "admin" && role === "user") {
    const adminCount = await getAdminCount();

    if (adminCount <= 1) {
      return { ok: false, message: "Eventor must always have at least one admin." };
    }

    if (actingUserId === targetUserId && adminCount <= 1) {
      return { ok: false, message: "You cannot demote the only admin account." };
    }
  }

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  return {
    ok: true,
    message: role === "admin" ? "User promoted to admin." : "Admin demoted to user.",
  };
}

export async function deleteAdminComment(
  actingUserId: number,
  commentId: number,
): Promise<AdminMutationResult> {
  await requireAdminUser(actingUserId);

  const [deleted] = await db
    .delete(eventComments)
    .where(eq(eventComments.id, commentId))
    .returning({ id: eventComments.id });

  if (!deleted) {
    return { ok: false, message: "Comment not found." };
  }

  return { ok: true, message: "Comment deleted." };
}

async function requireAdminUser(userId: number) {
  if (!(await isUserAdmin(userId))) {
    throw new Error("Admin access required.");
  }
}

async function getAdminCount() {
  return countRows(users, eq(users.role, "admin"));
}

async function countRows(
  table: typeof users | typeof groups | typeof events | typeof eventComments | typeof eventLinks | typeof groupInvites,
  filter?: ReturnType<typeof and>,
) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(filter);

  return row?.count ?? 0;
}

function getPagination(input: AdminPageInput) {
  const page = normalizePositiveInteger(input.page, 1);
  const pageSize = Math.min(normalizePositiveInteger(input.pageSize, 20), 100);

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

function getPagedResult<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): AdminPagedResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function getEventViewFilters(input: AdminEventsPageInput) {
  const filters = [];

  if (input.view === "active") {
    filters.push(
      sql<boolean>`(${events.eventDate} + ${events.eventTime}) >= now() - interval '1 hour'`,
    );
  } else if (input.view === "archive") {
    filters.push(
      sql<boolean>`(${events.eventDate} + ${events.eventTime}) < now() - interval '1 hour'`,
    );
  }

  if (input.canceled === "yes") {
    filters.push(eq(events.canceled, true));
  } else if (input.canceled === "no") {
    filters.push(eq(events.canceled, false));
  }

  return filters;
}

function normalizeSearch(value: string | undefined) {
  const search = value?.trim();

  return search ? search.slice(0, 120) : undefined;
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}
