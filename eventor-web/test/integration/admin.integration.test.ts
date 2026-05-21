import { eq } from "drizzle-orm";
import { describe, expect, it, beforeEach } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { signSessionToken } from "@/lib/auth/jwt";
import {
  deleteAdminComment,
  getAdminCommentsPage,
  getAdminDashboardStats,
  getAdminEventsPage,
  getAdminGroupsPage,
  getAdminUsersPage,
  updateAdminUserRole,
} from "@/services/admin";
import { eventComments, users } from "@/db/schema";
import {
  getIntegrationDb,
  resetAndSeedTestDb,
  type IntegrationSeed,
} from "./helpers/db";
import { apiFetch } from "./helpers/http";

describe("Admin panel integration", () => {
  let seed: IntegrationSeed;

  beforeEach(async () => {
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

  it("admin can delete a comment", async () => {
    const commentsPage = await getAdminCommentsPage(seed.users.admin.id);
    const [comment] = commentsPage.items;

    expect(comment?.text).toBe("Seeded integration comment");

    const result = await deleteAdminComment(seed.users.admin.id, comment.id);
    const db = getIntegrationDb();
    const remaining = await db
      .select({ id: eventComments.id })
      .from(eventComments)
      .where(eq(eventComments.id, comment.id));

    expect(result).toEqual({ ok: true, message: "Comment deleted." });
    expect(remaining).toHaveLength(0);
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
