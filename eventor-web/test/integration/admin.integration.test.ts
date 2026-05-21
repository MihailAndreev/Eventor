import { and, eq, inArray } from "drizzle-orm";
import { describe, expect, it, beforeEach, vi } from "vitest";

const storageCalls = vi.hoisted(() => ({
  deletes: [] as string[],
}));

vi.mock("@/lib/storage/r2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage/r2")>();

  return {
    ...actual,
    deleteImageObject: vi.fn(async (key: string | null | undefined) => {
      if (key) {
        storageCalls.deletes.push(key);
      }
    }),
  };
});

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { signSessionToken } from "@/lib/auth/jwt";
import {
  deleteAdminEvent,
  deleteAdminGroup,
  deleteAdminComment,
  getAdminCommentDeleteDetails,
  getAdminCommentsPage,
  getAdminDashboardStats,
  getAdminEventsPage,
  getAdminGroupsPage,
  getAdminUsersPage,
  updateAdminUserRole,
} from "@/services/admin";
import {
  eventComments,
  eventLinks,
  eventNotifications,
  eventParticipants,
  events,
  groupInvites,
  groupMembers,
  groups,
  users,
} from "@/db/schema";
import {
  getIntegrationDb,
  resetAndSeedTestDb,
  type IntegrationSeed,
} from "./helpers/db";
import { apiFetch } from "./helpers/http";

describe("Admin panel integration", () => {
  let seed: IntegrationSeed;

  beforeEach(async () => {
    storageCalls.deletes = [];
    seed = await resetAndSeedTestDb();
  });

  it("redirects anonymous users away from /admin", async () => {
    const response = await apiFetch("/admin", { redirect: "manual" });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?from=/admin");
  });

  it("shows access denied for regular users", async () => {
    const response = await apiFetch("/admin", {
      headers: { cookie: await getSessionCookie(seed.users.member) },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Access denied");
    expect(html).toContain("Admin access is required");
  });

  it("lets admin users access the dashboard", async () => {
    const response = await apiFetch("/admin", {
      headers: { cookie: await getSessionCookie(seed.users.admin) },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Overview");
    expect(html).toContain("Users");
    expect(html).toContain("Groups");
  });

  it("regular users cannot access destructive admin routes", async () => {
    const cookie = await getSessionCookie(seed.users.member);
    const responses = await Promise.all([
      apiFetch(`/admin/comments/1/delete`, { headers: { cookie } }),
      apiFetch(`/admin/groups/${seed.groups.primary.id}/delete`, {
        headers: { cookie },
      }),
      apiFetch(`/admin/events/${seed.events.active.id}/delete`, {
        headers: { cookie },
      }),
    ]);

    for (const response of responses) {
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain("Access denied");
    }
  });

  it("admin can open destructive confirmation pages", async () => {
    const cookie = await getSessionCookie(seed.users.admin);
    const commentsPage = await getAdminCommentsPage(seed.users.admin.id);
    const [comment] = commentsPage.items;
    const responses = await Promise.all([
      apiFetch(`/admin/comments/${comment.id}/delete`, { headers: { cookie } }),
      apiFetch(`/admin/groups/${seed.groups.primary.id}/delete`, {
        headers: { cookie },
      }),
      apiFetch(`/admin/events/${seed.events.active.id}/delete`, {
        headers: { cookie },
      }),
    ]);
    const html = await Promise.all(responses.map((response) => response.text()));

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(html[0]).toContain("Delete Comment");
    expect(html[1]).toContain("Delete Group");
    expect(html[2]).toContain("Delete Event");
  });

  it("admin can list users, groups, and events", async () => {
    const [stats, usersPage, groupsPage, eventsPage] = await Promise.all([
      getAdminDashboardStats(seed.users.admin.id),
      getAdminUsersPage(seed.users.admin.id),
      getAdminGroupsPage(seed.users.admin.id),
      getAdminEventsPage(seed.users.admin.id),
    ]);

    expect(stats.totalUsers).toBe(4);
    expect(stats.totalGroups).toBe(2);
    expect(stats.totalEvents).toBe(5);
    expect(stats.totalComments).toBe(1);
    expect(stats.totalEventLinks).toBe(0);
    expect(stats.pendingInvites).toBe(1);
    expect(usersPage.items.map((user) => user.email)).toContain(seed.users.admin.email);
    expect(groupsPage.items.map((group) => group.title)).toContain(seed.groups.primary.title);
    expect(eventsPage.items.map((event) => event.title)).toContain(seed.events.active.title);
  });

  it("only admins can change user roles", async () => {
    await expect(
      updateAdminUserRole(seed.users.member.id, seed.users.member.id, "admin"),
    ).rejects.toThrow("Admin access required.");

    const promoted = await updateAdminUserRole(
      seed.users.admin.id,
      seed.users.member.id,
      "admin",
    );
    const db = getIntegrationDb();
    const [member] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, seed.users.member.id));

    expect(promoted).toEqual({ ok: true, message: "User promoted to admin." });
    expect(member?.role).toBe("admin");
  });

  it("cannot demote the only admin", async () => {
    const result = await updateAdminUserRole(
      seed.users.admin.id,
      seed.users.admin.id,
      "user",
    );

    expect(result).toEqual({
      ok: false,
      message: "Eventor must always have at least one admin.",
    });
  });

  it("admin can delete a comment through confirmation", async () => {
    const commentsPage = await getAdminCommentsPage(seed.users.admin.id);
    const [comment] = commentsPage.items;

    expect(comment?.text).toBe("Seeded integration comment");

    const details = await getAdminCommentDeleteDetails(seed.users.admin.id, comment.id);
    const db = getIntegrationDb();
    const beforeConfirmation = await db
      .select({ id: eventComments.id })
      .from(eventComments)
      .where(eq(eventComments.id, comment.id));

    expect(details).toMatchObject({
      id: comment.id,
      authorName: seed.users.manager.name,
      eventTitle: seed.events.active.title,
      groupTitle: seed.groups.primary.title,
    });
    expect(beforeConfirmation).toHaveLength(1);

    const result = await deleteAdminComment(seed.users.admin.id, comment.id);
    const remaining = await db
      .select({ id: eventComments.id })
      .from(eventComments)
      .where(eq(eventComments.id, comment.id));

    expect(result).toEqual({ ok: true, message: "Comment deleted." });
    expect(remaining).toHaveLength(0);
  });

  it("admin can delete an event and cascade related records", async () => {
    const db = getIntegrationDb();

    await db
      .update(events)
      .set({ coverImageKey: "events/1/cover-test.webp" })
      .where(eq(events.id, seed.events.active.id));
    await db.insert(eventParticipants).values({
      eventId: seed.events.active.id,
      userId: seed.users.member.id,
      status: "going",
      extraSlots: 0,
    });
    await db.insert(eventLinks).values({
      eventId: seed.events.active.id,
      title: "Admin cascade link",
      url: "https://example.com/cascade",
      createdByUserId: seed.users.manager.id,
    });
    await db.insert(eventNotifications).values({
      userId: seed.users.member.id,
      groupId: seed.groups.primary.id,
      eventId: seed.events.active.id,
      type: "event_created",
      text: "Cascade notification",
    });

    const result = await deleteAdminEvent(seed.users.admin.id, seed.events.active.id);
    const [remainingEvent, remainingParticipants, remainingComments, remainingLinks, remainingNotifications] =
      await Promise.all([
        db.select({ id: events.id }).from(events).where(eq(events.id, seed.events.active.id)),
        db
          .select({ id: eventParticipants.id })
          .from(eventParticipants)
          .where(eq(eventParticipants.eventId, seed.events.active.id)),
        db
          .select({ id: eventComments.id })
          .from(eventComments)
          .where(eq(eventComments.eventId, seed.events.active.id)),
        db
          .select({ id: eventLinks.id })
          .from(eventLinks)
          .where(eq(eventLinks.eventId, seed.events.active.id)),
        db
          .select({ id: eventNotifications.id })
          .from(eventNotifications)
          .where(eq(eventNotifications.eventId, seed.events.active.id)),
      ]);

    expect(result).toEqual({ ok: true, message: "Event deleted." });
    expect(remainingEvent).toHaveLength(0);
    expect(remainingParticipants).toHaveLength(0);
    expect(remainingComments).toHaveLength(0);
    expect(remainingLinks).toHaveLength(0);
    expect(remainingNotifications).toHaveLength(0);
    expect(storageCalls.deletes).toEqual(["events/1/cover-test.webp"]);
  });

  it("admin can delete a group and cascade related records", async () => {
    const db = getIntegrationDb();
    const eventIds = Object.values(seed.events)
      .filter((event) => event.id !== seed.events.outside.id)
      .map((event) => event.id);

    await db
      .update(groups)
      .set({ coverImageKey: "groups/1/cover-test.png" })
      .where(eq(groups.id, seed.groups.primary.id));
    await db
      .update(events)
      .set({ coverImageKey: "events/group-cascade/cover-test.webp" })
      .where(eq(events.id, seed.events.active.id));
    await db.insert(eventLinks).values({
      eventId: seed.events.active.id,
      title: "Group cascade link",
      url: "https://example.com/group-cascade",
      createdByUserId: seed.users.manager.id,
    });
    await db.insert(eventNotifications).values({
      userId: seed.users.member.id,
      groupId: seed.groups.primary.id,
      eventId: seed.events.active.id,
      type: "event_updated",
      text: "Group cascade notification",
    });

    const result = await deleteAdminGroup(seed.users.admin.id, seed.groups.primary.id);
    const [
      remainingGroup,
      remainingMembers,
      remainingInvites,
      remainingEvents,
      remainingParticipants,
      remainingComments,
      remainingLinks,
      remainingNotifications,
    ] = await Promise.all([
      db.select({ id: groups.id }).from(groups).where(eq(groups.id, seed.groups.primary.id)),
      db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, seed.groups.primary.id)),
      db
        .select({ id: groupInvites.id })
        .from(groupInvites)
        .where(eq(groupInvites.groupId, seed.groups.primary.id)),
      db.select({ id: events.id }).from(events).where(eq(events.groupId, seed.groups.primary.id)),
      db
        .select({ id: eventParticipants.id })
        .from(eventParticipants)
        .where(inArray(eventParticipants.eventId, eventIds)),
      db
        .select({ id: eventComments.id })
        .from(eventComments)
        .where(inArray(eventComments.eventId, eventIds)),
      db
        .select({ id: eventLinks.id })
        .from(eventLinks)
        .where(inArray(eventLinks.eventId, eventIds)),
      db
        .select({ id: eventNotifications.id })
        .from(eventNotifications)
        .where(
          and(
            eq(eventNotifications.groupId, seed.groups.primary.id),
            inArray(eventNotifications.eventId, eventIds),
          ),
        ),
    ]);

    expect(result).toEqual({ ok: true, message: "Group deleted." });
    expect(remainingGroup).toHaveLength(0);
    expect(remainingMembers).toHaveLength(0);
    expect(remainingInvites).toHaveLength(0);
    expect(remainingEvents).toHaveLength(0);
    expect(remainingParticipants).toHaveLength(0);
    expect(remainingComments).toHaveLength(0);
    expect(remainingLinks).toHaveLength(0);
    expect(remainingNotifications).toHaveLength(0);
    expect(storageCalls.deletes).toEqual([
      "groups/1/cover-test.png",
      "events/group-cascade/cover-test.webp",
    ]);
  });
});

async function getSessionCookie(user: {
  id: number;
  email: string;
  name: string;
  role?: "user" | "admin";
}) {
  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? "user",
  });

  return `${SESSION_COOKIE_NAME}=${token}`;
}
