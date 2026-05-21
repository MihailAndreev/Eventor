import "server-only";

import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  eventParticipants,
  events,
  groupInvites,
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

export type GroupManagementAccessResult =
  | { ok: true; group: Pick<GroupDetails, "id" | "title" | "description" | "currentUserIsManager"> }
  | { ok: false; reason: "not_found" | "not_member" | "not_manager" };

export type GroupMutationResult =
  | { ok: true; message: string; groupId?: number }
  | { ok: false; message: string };

export type GroupInviteCreationResult =
  | { ok: true; message: string; invitePath: string; inviteToken: string }
  | { ok: false; message: string };

export type GroupInviteAcceptanceResult =
  | { ok: true; status: "accepted" | "already_member"; message: string; groupId: number }
  | { ok: false; message: string; groupId?: number };

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

export async function getUserGroupManagementAccess(
  userId: number,
  groupId: number,
): Promise<GroupManagementAccessResult> {
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

  return {
    ok: true,
    group: {
      ...group,
      currentUserIsManager: true,
    },
  };
}

export async function createGroup(
  userId: number,
  input: { title: string; description: string },
): Promise<GroupMutationResult> {
  const validation = validateGroupInput(input);

  if (!validation.ok) {
    return validation;
  }

  const [createdGroup] = await db
    .insert(groups)
    .values({
      title: validation.title,
      description: validation.description,
      createdByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: groups.id });

  if (!createdGroup) {
    return { ok: false, message: "Group could not be created." };
  }

  await db.insert(groupMembers).values({
    groupId: createdGroup.id,
    userId,
    isManager: true,
    joinedAt: new Date(),
  });

  return {
    ok: true,
    message: "Group created.",
    groupId: createdGroup.id,
  };
}

export async function updateGroup(
  userId: number,
  groupId: number,
  input: { title: string; description: string },
): Promise<GroupMutationResult> {
  const access = await getUserGroupManagementAccess(userId, groupId);

  if (!access.ok) {
    return getGroupAccessMutationError(access.reason);
  }

  const validation = validateGroupInput(input);

  if (!validation.ok) {
    return validation;
  }

  await db
    .update(groups)
    .set({
      title: validation.title,
      description: validation.description,
      updatedAt: new Date(),
    })
    .where(eq(groups.id, groupId));

  return { ok: true, message: "Group updated.", groupId };
}

export async function deleteGroup(
  userId: number,
  groupId: number,
): Promise<GroupMutationResult> {
  const access = await getUserGroupManagementAccess(userId, groupId);

  if (!access.ok) {
    return getGroupAccessMutationError(access.reason);
  }

  await db.delete(groups).where(eq(groups.id, groupId));

  return { ok: true, message: "Group deleted." };
}

export async function createGroupInvite(
  userId: number,
  groupId: number,
): Promise<GroupInviteCreationResult> {
  const access = await getUserGroupManagementAccess(userId, groupId);

  if (!access.ok) {
    return getGroupInviteAccessError(access.reason);
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const inviteToken = randomBytes(32).toString("base64url");
    const [createdInvite] = await db
      .insert(groupInvites)
      .values({
        groupId,
        createdByUserId: userId,
        inviteToken,
        status: "pending",
        isActive: true,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ inviteToken: groupInvites.inviteToken });

    if (createdInvite) {
      return {
        ok: true,
        message: "Invite link created.",
        invitePath: `/groups/${groupId}/join?code=${createdInvite.inviteToken}`,
        inviteToken: createdInvite.inviteToken,
      };
    }
  }

  return { ok: false, message: "Invite link could not be created. Try again." };
}

export async function acceptGroupInvite(
  userId: number,
  groupId: number,
  inviteToken: string,
): Promise<GroupInviteAcceptanceResult> {
  const normalizedToken = inviteToken.trim();

  if (normalizedToken.length === 0) {
    return { ok: false, message: "This invite link is missing its invite code." };
  }

  const [invite] = await db
    .select({
      id: groupInvites.id,
      groupId: groupInvites.groupId,
      status: groupInvites.status,
      isActive: groupInvites.isActive,
      expiresAt: groupInvites.expiresAt,
    })
    .from(groupInvites)
    .where(
      and(
        eq(groupInvites.groupId, groupId),
        eq(groupInvites.inviteToken, normalizedToken),
      ),
    )
    .limit(1);

  if (!invite) {
    return {
      ok: false,
      message: "This invite link is not valid for this group.",
      groupId,
    };
  }

  const existingMembership = await getGroupMembership(userId, groupId);

  if (existingMembership) {
    return {
      ok: true,
      status: "already_member",
      message: "You are already a member of this group.",
      groupId,
    };
  }

  if (!invite.isActive || invite.status === "revoked") {
    return {
      ok: false,
      message: "This invite link has been revoked.",
      groupId,
    };
  }

  if (invite.status === "accepted") {
    return {
      ok: false,
      message: "This invite link has already been used.",
      groupId,
    };
  }

  if (
    invite.status === "expired" ||
    (invite.expiresAt && invite.expiresAt.getTime() <= Date.now())
  ) {
    return {
      ok: false,
      message: "This invite link has expired.",
      groupId,
    };
  }

  const now = new Date();
  const [consumedInvite] = await db
    .update(groupInvites)
    .set({
      status: "accepted",
      isActive: false,
      acceptedAt: now,
    })
    .where(
      and(
        eq(groupInvites.id, invite.id),
        eq(groupInvites.status, "pending"),
        eq(groupInvites.isActive, true),
      ),
    )
    .returning({ id: groupInvites.id });

  if (!consumedInvite) {
    return {
      ok: false,
      message: "This invite link has already been used.",
      groupId,
    };
  }

  const [createdMembership] = await db
    .insert(groupMembers)
    .values({
      groupId,
      userId,
      isManager: false,
      joinedAt: now,
    })
    .onConflictDoNothing()
    .returning({ id: groupMembers.id });

  if (!createdMembership) {
    return {
      ok: true,
      status: "already_member",
      message: "You are already a member of this group.",
      groupId,
    };
  }

  return {
    ok: true,
    status: "accepted",
    message: "You joined the group.",
    groupId,
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

async function getGroupMembership(userId: number, groupId: number) {
  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);

  return membership;
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

function validateGroupInput(input: {
  title: string;
  description: string;
}): { ok: true; title: string; description: string | null } | { ok: false; message: string } {
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length === 0) {
    return { ok: false, message: "Enter a group title." };
  }

  if (title.length > 180) {
    return { ok: false, message: "Group titles must be 180 characters or less." };
  }

  if (description.length > 1000) {
    return {
      ok: false,
      message: "Group descriptions must be 1000 characters or less.",
    };
  }

  return {
    ok: true,
    title,
    description: description.length > 0 ? description : null,
  };
}

function getGroupAccessMutationError(
  reason: "not_found" | "not_member" | "not_manager",
): GroupMutationResult {
  switch (reason) {
    case "not_found":
      return { ok: false, message: "Group not found." };
    case "not_member":
      return { ok: false, message: "You are not a member of this group." };
    case "not_manager":
      return { ok: false, message: "Only group managers can change this group." };
  }
}

function getGroupInviteAccessError(
  reason: "not_found" | "not_member" | "not_manager",
): GroupInviteCreationResult {
  switch (reason) {
    case "not_found":
      return { ok: false, message: "Group not found." };
    case "not_member":
      return { ok: false, message: "You are not a member of this group." };
    case "not_manager":
      return { ok: false, message: "Only group managers can create invite links." };
  }
}
