"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createGroup,
  createGroupInvite,
  demoteGroupMember,
  deleteGroup,
  leaveGroup,
  promoteGroupMember,
  removeGroupCoverImage,
  removeGroupMember,
  updateGroup,
  updateGroupCoverImage,
} from "@/services/groups";
import type {
  GroupActionState,
  GroupInviteActionState,
  GroupMemberActionState,
} from "./types";

export async function createGroupAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/groups/new");
  }

  const result = await createGroup(currentUser.id, getGroupFormInput(formData));

  if (!result.ok) {
    return result;
  }

  revalidatePath("/groups");
  redirect(`/groups/${result.groupId}`);
}

export async function updateGroupAction(
  groupId: number,
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/edit`);
  }

  const result = await updateGroup(
    currentUser.id,
    groupId,
    getGroupFormInput(formData),
  );

  if (!result.ok) {
    return result;
  }

  revalidateGroupPaths(groupId);
  redirect(`/groups/${groupId}`);
}

export async function updateGroupCoverImageAction(
  groupId: number,
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/edit`);
  }

  const file = formData.get("coverImage");

  if (!(file instanceof File)) {
    return { ok: false, message: "Choose an image before saving." };
  }

  const result = await updateGroupCoverImage(currentUser.id, groupId, file);

  revalidateGroupPaths(groupId);

  return result;
}

export async function removeGroupCoverImageAction(
  groupId: number,
  previousState: GroupActionState,
): Promise<GroupActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/edit`);
  }

  const result = await removeGroupCoverImage(currentUser.id, groupId);

  revalidateGroupPaths(groupId);

  return result;
}

export async function deleteGroupAction(
  groupId: number,
  previousState: GroupActionState,
): Promise<GroupActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/delete`);
  }

  const result = await deleteGroup(currentUser.id, groupId);

  if (!result.ok) {
    return result;
  }

  revalidateGroupPaths(groupId);
  redirect("/groups");
}

export async function createGroupInviteAction(
  groupId: number,
  previousState: GroupInviteActionState,
): Promise<GroupInviteActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}`);
  }

  const result = await createGroupInvite(currentUser.id, groupId);

  if (!result.ok) {
    return result;
  }

  revalidatePath(`/groups/${groupId}`);

  return {
    ok: true,
    message: result.message,
    invitePath: result.invitePath,
  };
}

export async function leaveGroupAction(
  groupId: number,
  previousState: GroupActionState,
): Promise<GroupActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/leave`);
  }

  const result = await leaveGroup(currentUser.id, groupId);

  if (!result.ok) {
    return result;
  }

  revalidateGroupPaths(groupId);
  redirect("/groups");
}

export async function promoteGroupMemberAction(
  groupId: number,
  targetUserId: number,
  previousState: GroupMemberActionState,
): Promise<GroupMemberActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/members`);
  }

  const result = await promoteGroupMember(
    currentUser.id,
    groupId,
    targetUserId,
  );

  revalidateGroupMemberManagementPaths(groupId);

  return { ...result, targetUserId };
}

export async function demoteGroupMemberAction(
  groupId: number,
  targetUserId: number,
  previousState: GroupMemberActionState,
): Promise<GroupMemberActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/members`);
  }

  const result = await demoteGroupMember(
    currentUser.id,
    groupId,
    targetUserId,
  );

  revalidateGroupMemberManagementPaths(groupId);

  return { ...result, targetUserId };
}

export async function removeGroupMemberAction(
  groupId: number,
  targetUserId: number,
  previousState: GroupMemberActionState,
): Promise<GroupMemberActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/members`);
  }

  const result = await removeGroupMember(
    currentUser.id,
    groupId,
    targetUserId,
  );

  revalidateGroupMemberManagementPaths(groupId);

  return { ...result, targetUserId };
}

function getGroupFormInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

function revalidateGroupPaths(groupId: number) {
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
}

function revalidateGroupMemberManagementPaths(groupId: number) {
  revalidateGroupPaths(groupId);
  revalidatePath(`/groups/${groupId}/members`);
}
