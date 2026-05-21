import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptGroupInvite,
  createGroupInvite,
  demoteGroupMember,
  leaveGroup,
  promoteGroupMember,
  removeGroupMember,
} from "./groups";

type DbQueues = {
  select: unknown[][];
  insert: unknown[][];
  update: unknown[][];
  delete: unknown[][];
};

const dbQueues = vi.hoisted<DbQueues>(() => ({
  select: [],
  insert: [],
  update: [],
  delete: [],
}));

const dbCalls = vi.hoisted(() => ({
  insertValues: [] as unknown[],
  updateSets: [] as unknown[],
  deletes: 0,
}));

vi.mock("@/db", () => {
  function thenableBuilder(result: unknown[]) {
    const builder = {
      from: vi.fn(() => builder),
      innerJoin: vi.fn(() => builder),
      where: vi.fn(() => builder),
      limit: vi.fn(() => Promise.resolve(result)),
      orderBy: vi.fn(() => Promise.resolve(result)),
      groupBy: vi.fn(() => Promise.resolve(result)),
      returning: vi.fn(() => Promise.resolve(result)),
      then: (
        resolve: (value: unknown[]) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result).then(resolve, reject),
    };

    return builder;
  }

  return {
    db: {
      select: vi.fn(() => thenableBuilder(dbQueues.select.shift() ?? [])),
      insert: vi.fn(() => {
        const result = dbQueues.insert.shift() ?? [];
        const builder = {
          values: vi.fn((value: unknown) => {
            dbCalls.insertValues.push(value);
            return builder;
          }),
          onConflictDoNothing: vi.fn(() => builder),
          returning: vi.fn(() => Promise.resolve(result)),
        };

        return builder;
      }),
      update: vi.fn(() => {
        const result = dbQueues.update.shift() ?? [];
        const builder = {
          set: vi.fn((value: unknown) => {
            dbCalls.updateSets.push(value);
            return builder;
          }),
          where: vi.fn(() => builder),
          returning: vi.fn(() => Promise.resolve(result)),
          then: (
            resolve: (value: unknown[]) => unknown,
            reject?: (reason: unknown) => unknown,
          ) => Promise.resolve(result).then(resolve, reject),
        };

        return builder;
      }),
      delete: vi.fn(() => {
        dbCalls.deletes += 1;
        const result = dbQueues.delete.shift() ?? [];
        const builder = {
          where: vi.fn(() => Promise.resolve(result)),
        };

        return builder;
      }),
    },
  };
});

describe("group service business rules", () => {
  beforeEach(() => {
    dbQueues.select = [];
    dbQueues.insert = [];
    dbQueues.update = [];
    dbQueues.delete = [];
    dbCalls.insertValues = [];
    dbCalls.updateSets = [];
    dbCalls.deletes = 0;
  });

  it("allows only group managers to create invite links", async () => {
    dbQueues.select.push([{ id: 10, title: "Hikers", description: null }]);
    dbQueues.select.push([{ isManager: false }]);

    await expect(createGroupInvite(2, 10)).resolves.toEqual({
      ok: false,
      message: "Only group managers can create invite links.",
    });
    expect(dbCalls.insertValues).toHaveLength(0);
  });

  it("accepting an invite adds a regular member, not a manager", async () => {
    dbQueues.select.push([
      {
        id: 33,
        groupId: 10,
        status: "pending",
        isActive: true,
        expiresAt: null,
      },
    ]);
    dbQueues.select.push([]);
    dbQueues.update.push([{ id: 33 }]);
    dbQueues.insert.push([{ id: 99 }]);

    await expect(acceptGroupInvite(7, 10, "  abc123  ")).resolves.toEqual({
      ok: true,
      status: "accepted",
      message: "You joined the group.",
      groupId: 10,
    });
    expect(dbCalls.insertValues).toMatchObject([
      {
        groupId: 10,
        userId: 7,
        isManager: false,
      },
    ]);
  });

  it("rejects a missing invite code before touching the database", async () => {
    await expect(acceptGroupInvite(7, 10, "   ")).resolves.toEqual({
      ok: false,
      message: "This invite link is missing its invite code.",
    });
    expect(dbCalls.insertValues).toHaveLength(0);
  });

  it("prevents duplicate group membership when accepting an invite", async () => {
    dbQueues.select.push([
      {
        id: 33,
        groupId: 10,
        status: "pending",
        isActive: true,
        expiresAt: null,
      },
    ]);
    dbQueues.select.push([{ id: 5, isManager: false }]);

    await expect(acceptGroupInvite(7, 10, "abc123")).resolves.toEqual({
      ok: true,
      status: "already_member",
      message: "You are already a member of this group.",
      groupId: 10,
    });
    expect(dbCalls.updateSets).toHaveLength(0);
    expect(dbCalls.insertValues).toHaveLength(0);
  });

  it("allows a non-only manager to leave a group", async () => {
    dbQueues.select.push([{ id: 10 }]);
    dbQueues.select.push([{ id: 3, isManager: true }]);
    dbQueues.select.push([{ count: 2 }]);
    dbQueues.select.push([]);
    dbQueues.delete.push([]);

    await expect(leaveGroup(7, 10)).resolves.toEqual({
      ok: true,
      message: "You left the group.",
      groupId: 10,
    });
    expect(dbCalls.deletes).toBe(1);
  });

  it("blocks the only manager from leaving", async () => {
    dbQueues.select.push([{ id: 10 }]);
    dbQueues.select.push([{ id: 3, isManager: true }]);
    dbQueues.select.push([{ count: 1 }]);

    await expect(leaveGroup(7, 10)).resolves.toEqual({
      ok: false,
      message:
        "You are the only manager of this group. Promote another member to manager before leaving.",
    });
    expect(dbCalls.deletes).toBe(0);
  });

  it("promotes regular members", async () => {
    dbQueues.select.push([{ id: 10, title: "Hikers", description: null }]);
    dbQueues.select.push([{ isManager: true }]);
    dbQueues.select.push([{ id: 8, isManager: false }]);
    dbQueues.update.push([]);

    await expect(promoteGroupMember(1, 10, 7)).resolves.toEqual({
      ok: true,
      message: "Member promoted to manager.",
      groupId: 10,
    });
    expect(dbCalls.updateSets).toEqual([{ isManager: true }]);
  });

  it("keeps at least one manager when demoting", async () => {
    dbQueues.select.push([{ id: 10, title: "Hikers", description: null }]);
    dbQueues.select.push([{ isManager: true }]);
    dbQueues.select.push([{ id: 8, isManager: true }]);
    dbQueues.select.push([{ count: 1 }]);

    await expect(demoteGroupMember(1, 10, 7)).resolves.toEqual({
      ok: false,
      message: "This group must always have at least one manager.",
    });
    expect(dbCalls.updateSets).toHaveLength(0);
  });

  it("removing members deletes membership only", async () => {
    dbQueues.select.push([{ id: 10, title: "Hikers", description: null }]);
    dbQueues.select.push([{ isManager: true }]);
    dbQueues.select.push([{ id: 8, isManager: false }]);
    dbQueues.select.push([]);
    dbQueues.delete.push([]);

    await expect(removeGroupMember(1, 10, 7)).resolves.toEqual({
      ok: true,
      message: "Member removed from the group.",
      groupId: 10,
    });
    expect(dbCalls.deletes).toBe(1);
  });
});
