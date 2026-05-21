"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createGroup,
  deleteGroup,
  updateGroup,
} from "@/services/groups";
import type { GroupActionState } from "./types";

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
