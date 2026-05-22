import { describe, expect, it, beforeEach } from "vitest";
import { apiFetch, login } from "./helpers/http";
import { resetAndSeedTestDb, type IntegrationSeed } from "./helpers/db";

describe("Eventor API integration", () => {
  let seed: IntegrationSeed;

  beforeEach(async () => {
    seed = await resetAndSeedTestDb();
  });

  it("logs in with valid credentials and rejects invalid credentials", async () => {
    const valid = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: seed.users.member.email,
        password: seed.password,
      }),
    });
    const validBody = await valid.json();

    expect(valid.status).toBe(200);
    expect(validBody.tokenType).toBe("Bearer");
    expect(typeof validBody.token).toBe("string");
    expect(validBody.user.email).toBe(seed.users.member.email);

    const invalid = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: seed.users.member.email,
        password: "wrong-password",
      }),
    });
    const invalidBody = await invalid.json();

    expect(invalid.status).toBe(401);
    expect(invalidBody.error).toBe("Invalid email or password.");
  });

  it("registers users and rejects invalid or duplicate registration requests", async () => {
    const valid = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "New Mobile User",
        email: "new.mobile@example.com",
        password: "strong-password",
      }),
    });
    const validBody = await valid.json();

    expect(valid.status).toBe(200);
    expect(validBody.tokenType).toBe("Bearer");
    expect(typeof validBody.token).toBe("string");
    expect(validBody.user).toMatchObject({
      email: "new.mobile@example.com",
      name: "New Mobile User",
      role: "user",
    });

    const invalid = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "N",
        email: "not-an-email",
        password: "short",
      }),
    });
    const invalidBody = await invalid.json();

    expect(invalid.status).toBe(400);
    expect(invalidBody.error).toBe("Enter your full name.");

    const duplicate = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate Member",
        email: seed.users.member.email,
        password: seed.password,
      }),
    });
    const duplicateBody = await duplicate.json();

    expect(duplicate.status).toBe(409);
    expect(duplicateBody.error).toBe("An account with this email already exists.");
  });

  it("rejects anonymous event API requests", async () => {
    const list = await apiFetch("/api/events");
    const details = await apiFetch(`/api/events/${seed.events.active.id}`);
    const join = await apiFetch(`/api/events/${seed.events.active.id}/join`, {
      method: "POST",
    });

    expect(list.status).toBe(401);
    expect(details.status).toBe(401);
    expect(join.status).toBe(401);
  });

  it("lets logged-in group members list and view events in their groups", async () => {
    const { token } = await login(seed.users.member.email, seed.password);

    const list = await apiFetch("/api/events", { token });
    const listBody = await list.json();

    expect(list.status).toBe(200);
    expect(listBody.data.map((event: { id: number }) => event.id)).toContain(seed.events.active.id);
    expect(listBody.data.map((event: { id: number }) => event.id)).toContain(seed.events.full.id);
    expect(listBody.data.map((event: { id: number }) => event.id)).not.toContain(seed.events.canceled.id);
    expect(listBody.data.map((event: { id: number }) => event.id)).not.toContain(seed.events.past.id);
    expect(listBody.data.map((event: { id: number }) => event.id)).not.toContain(seed.events.outside.id);

    const details = await apiFetch(`/api/events/${seed.events.active.id}`, { token });
    const detailsBody = await details.json();

    expect(details.status).toBe(200);
    expect(detailsBody.data.id).toBe(seed.events.active.id);
    expect(detailsBody.data.commentsCount).toBe(1);
  });

  it("prevents users from viewing events outside their groups", async () => {
    const { token } = await login(seed.users.member.email, seed.password);

    const response = await apiFetch(`/api/events/${seed.events.outside.id}`, { token });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You are not a member of this event group.");
  });

  it("returns proper errors for invalid event ids", async () => {
    const { token } = await login(seed.users.member.email, seed.password);

    const response = await apiFetch("/api/events/not-a-number", { token });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Event not found.");
  });

  it("supports join, extra slots update, and leave for active events", async () => {
    const { token } = await login(seed.users.member.email, seed.password);

    const join = await apiFetch(`/api/events/${seed.events.active.id}/join`, {
      method: "POST",
      token,
    });
    const joinBody = await join.json();

    expect(join.status).toBe(200);
    expect(joinBody).toEqual({ ok: true, message: "Joined event." });

    const slots = await apiFetch(`/api/events/${seed.events.active.id}/slots`, {
      method: "POST",
      token,
      body: JSON.stringify({ extraSlots: 1 }),
    });
    const slotsBody = await slots.json();

    expect(slots.status).toBe(200);
    expect(slotsBody).toEqual({ ok: true, message: "Reserved slots updated." });

    const detailsAfterSlots = await apiFetch(`/api/events/${seed.events.active.id}`, { token });
    const detailsBody = await detailsAfterSlots.json();

    expect(detailsBody.data.isJoined).toBe(true);
    expect(detailsBody.data.currentUserReservedSlots).toBe(1);
    expect(detailsBody.data.attendeeCount).toBe(2);

    const leave = await apiFetch(`/api/events/${seed.events.active.id}/leave`, {
      method: "POST",
      token,
    });
    const leaveBody = await leave.json();

    expect(leave.status).toBe(200);
    expect(leaveBody).toEqual({ ok: true, message: "Left event." });

    const detailsAfterLeave = await apiFetch(`/api/events/${seed.events.active.id}`, { token });
    const afterLeaveBody = await detailsAfterLeave.json();

    expect(afterLeaveBody.data.isJoined).toBe(false);
    expect(afterLeaveBody.data.currentUserReservedSlots).toBe(0);
  });

  it("supports event comment create, edit, and delete over the REST API", async () => {
    const { token } = await login(seed.users.member.email, seed.password);

    const add = await apiFetch(`/api/events/${seed.events.active.id}/comments`, {
      method: "POST",
      token,
      body: JSON.stringify({ text: "I can bring snacks." }),
    });
    const addBody = await add.json();

    expect(add.status).toBe(200);
    expect(addBody).toEqual({ ok: true, message: "Comment added." });

    const detailsAfterAdd = await apiFetch(`/api/events/${seed.events.active.id}`, { token });
    const addedComment = (await detailsAfterAdd.json()).data.comments.find(
      (comment: { text: string }) => comment.text === "I can bring snacks.",
    );

    expect(addedComment).toMatchObject({
      authorId: seed.users.member.id,
      authorName: seed.users.member.name,
      text: "I can bring snacks.",
    });

    const update = await apiFetch(
      `/api/events/${seed.events.active.id}/comments/${addedComment.id}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ text: "I can bring water." }),
      },
    );

    expect(update.status).toBe(200);
    expect(await update.json()).toEqual({ ok: true, message: "Comment updated." });

    const detailsAfterUpdate = await apiFetch(`/api/events/${seed.events.active.id}`, { token });
    const updatedComment = (await detailsAfterUpdate.json()).data.comments.find(
      (comment: { id: number }) => comment.id === addedComment.id,
    );

    expect(updatedComment.text).toBe("I can bring water.");

    const remove = await apiFetch(
      `/api/events/${seed.events.active.id}/comments/${addedComment.id}`,
      { method: "DELETE", token },
    );

    expect(remove.status).toBe(200);
    expect(await remove.json()).toEqual({ ok: true, message: "Comment deleted." });
  });

  it("enforces comment API validation and authorization", async () => {
    const memberLogin = await login(seed.users.member.email, seed.password);
    const managerLogin = await login(seed.users.manager.email, seed.password);
    const outsideLogin = await login(seed.users.outside.email, seed.password);

    const invalid = await apiFetch(`/api/events/${seed.events.active.id}/comments`, {
      method: "POST",
      token: memberLogin.token,
      body: JSON.stringify({ text: "   " }),
    });

    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: "Enter a comment before saving." });

    const outside = await apiFetch(`/api/events/${seed.events.active.id}/comments`, {
      method: "POST",
      token: outsideLogin.token,
      body: JSON.stringify({ text: "Can I join?" }),
    });

    expect(outside.status).toBe(403);
    expect(await outside.json()).toEqual({
      error: "You are not a member of this event group.",
    });

    const memberComment = await apiFetch(`/api/events/${seed.events.active.id}/comments`, {
      method: "POST",
      token: memberLogin.token,
      body: JSON.stringify({ text: "Member-owned comment." }),
    });

    expect(memberComment.status).toBe(200);

    const memberDetails = await apiFetch(`/api/events/${seed.events.active.id}`, {
      token: memberLogin.token,
    });
    const comment = (await memberDetails.json()).data.comments.find(
      (item: { text: string }) => item.text === "Member-owned comment.",
    );

    const managerEdit = await apiFetch(
      `/api/events/${seed.events.active.id}/comments/${comment.id}`,
      {
        method: "PATCH",
        token: managerLogin.token,
        body: JSON.stringify({ text: "Manager edit attempt." }),
      },
    );

    expect(managerEdit.status).toBe(403);
    expect(await managerEdit.json()).toEqual({
      error: "You can only edit your own comments.",
    });

    const managerDelete = await apiFetch(
      `/api/events/${seed.events.active.id}/comments/${comment.id}`,
      { method: "DELETE", token: managerLogin.token },
    );

    expect(managerDelete.status).toBe(200);
    expect(await managerDelete.json()).toEqual({ ok: true, message: "Comment deleted." });

    const missing = await apiFetch(
      `/api/events/${seed.events.active.id}/comments/${comment.id}`,
      { method: "DELETE", token: memberLogin.token },
    );

    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Comment not found." });
  });

  it("enforces capacity rules", async () => {
    const { token } = await login(seed.users.member.email, seed.password);

    const fullJoin = await apiFetch(`/api/events/${seed.events.full.id}/join`, {
      method: "POST",
      token,
    });
    const fullJoinBody = await fullJoin.json();

    expect(fullJoin.status).toBe(400);
    expect(fullJoinBody).toEqual({
      ok: false,
      message: "This event is already at full capacity.",
    });

    await apiFetch(`/api/events/${seed.events.active.id}/join`, {
      method: "POST",
      token,
    });

    const tooManySlots = await apiFetch(`/api/events/${seed.events.active.id}/slots`, {
      method: "POST",
      token,
      body: JSON.stringify({ extraSlots: 3 }),
    });
    const tooManySlotsBody = await tooManySlots.json();

    expect(tooManySlots.status).toBe(400);
    expect(tooManySlotsBody).toEqual({
      ok: false,
      message: "There is not enough remaining capacity for those extra slots.",
    });
  });

  it("does not allow joining canceled or past events", async () => {
    const { token } = await login(seed.users.member.email, seed.password);

    const canceled = await apiFetch(`/api/events/${seed.events.canceled.id}/join`, {
      method: "POST",
      token,
    });
    const past = await apiFetch(`/api/events/${seed.events.past.id}/join`, {
      method: "POST",
      token,
    });

    expect(canceled.status).toBe(400);
    expect(await canceled.json()).toEqual({
      ok: false,
      message: "This event is not open to join.",
    });
    expect(past.status).toBe(400);
    expect(await past.json()).toEqual({
      ok: false,
      message: "This event is not open to join.",
    });
  });
});
