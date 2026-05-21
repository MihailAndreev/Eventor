import { eq, and } from "drizzle-orm";
import { describe, expect, it, beforeEach } from "vitest";
import { groupInvites, groupMembers } from "@/db/schema";
import {
  acceptGroupInvite,
  createGroupInvite,
  demoteGroupMember,
  leaveGroup,
  promoteGroupMember,
  removeGroupMember,
} from "@/services/groups";
import {
  getIntegrationDb,
  resetAndSeedTestDb,
  type IntegrationSeed,
} from "./helpers/db";

describe("Group backend integration flows", () => {
  let seed: IntegrationSeed;

  beforeEach(async () => {
    seed = await resetAndSeedTestDb();
  });

  it("accepts invites and prevents duplicate group memberships", async () => {
    const invite = await createGroupInvite(seed.users.manager.id, seed.groups.primary.id);

    expect(invite.ok).toBe(true);
    if (!invite.ok) {
      throw new Error(invite.message);
    }

    const accepted = await acceptGroupInvite(
      seed.users.outside.id,
      seed.groups.primary.id,
      invite.inviteToken,
    );

    expect(accepted).toEqual({
      ok: true,
      status: "accepted",
      message: "You joined the group.",
      groupId: seed.groups.primary.id,
    });

    const duplicate = await acceptGroupInvite(
      seed.users.outside.id,
      seed.groups.primary.id,
      invite.inviteToken,
    );

    expect(duplicate).toEqual({
      ok: true,
      status: "already_member",
      message: "You are already a member of this group.",
      groupId: seed.groups.primary.id,
    });

    const db = getIntegrationDb();
    const memberships = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, seed.groups.primary.id),
          eq(groupMembers.userId, seed.users.outside.id),
        ),
      );
    const [storedInvite] = await db
      .select({
        status: groupInvites.status,
        isActive: groupInvites.isActive,
      })
      .from(groupInvites)
      .where(eq(groupInvites.inviteToken, invite.inviteToken));

    expect(memberships).toHaveLength(1);
    expect(storedInvite).toEqual({ status: "accepted", isActive: false });
  });

  it("allows regular members to leave and blocks the only manager from leaving", async () => {
    const memberLeave = await leaveGroup(seed.users.member.id, seed.groups.primary.id);

    expect(memberLeave).toEqual({
      ok: true,
      message: "You left the group.",
      groupId: seed.groups.primary.id,
    });

    const onlyManagerLeave = await leaveGroup(seed.users.manager.id, seed.groups.primary.id);

    expect(onlyManagerLeave).toEqual({
      ok: false,
      message:
        "You are the only manager of this group. Promote another member to manager before leaving.",
    });
  });

  it("lets managers promote and demote members while preventing zero-manager state", async () => {
    const promoted = await promoteGroupMember(
      seed.users.manager.id,
      seed.groups.primary.id,
      seed.users.member.id,
    );

    expect(promoted).toEqual({
      ok: true,
      message: "Member promoted to manager.",
      groupId: seed.groups.primary.id,
    });

    const demoted = await demoteGroupMember(
      seed.users.manager.id,
      seed.groups.primary.id,
      seed.users.member.id,
    );

    expect(demoted).toEqual({
      ok: true,
      message: "Manager demoted to member.",
      groupId: seed.groups.primary.id,
    });

    const zeroManager = await demoteGroupMember(
      seed.users.manager.id,
      seed.groups.primary.id,
      seed.users.manager.id,
    );

    expect(zeroManager).toEqual({
      ok: false,
      message: "This group must always have at least one manager.",
    });
  });

  it("lets managers remove members and prevents removing the only manager", async () => {
    const removedMember = await removeGroupMember(
      seed.users.manager.id,
      seed.groups.primary.id,
      seed.users.member.id,
    );

    expect(removedMember).toEqual({
      ok: true,
      message: "Member removed from the group.",
      groupId: seed.groups.primary.id,
    });

    const removeOnlyManager = await removeGroupMember(
      seed.users.manager.id,
      seed.groups.primary.id,
      seed.users.manager.id,
    );

    expect(removeOnlyManager).toEqual({
      ok: false,
      message: "Use Leave Group to remove yourself from this group.",
    });
  });
});
