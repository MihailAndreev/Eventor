"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  deleteAdminComment,
  deleteAdminEvent,
  deleteAdminGroup,
  getAdminCommentDeleteDetails,
  getAdminEventDeleteDetails,
  updateAdminUserRole,
  type AdminRole,
} from "@/services/admin";

export async function updateUserRoleAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  const targetUserId = Number(formData.get("userId"));
  const role = String(formData.get("role"));

  if (!Number.isInteger(targetUserId) || (role !== "user" && role !== "admin")) {
    throw new Error("Invalid user role change.");
  }

  await updateAdminUserRole(currentUser.id, targetUserId, role as AdminRole);
  revalidatePath("/admin/users");
}

export async function deleteCommentAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  const commentId = Number(formData.get("commentId"));

  if (!Number.isInteger(commentId)) {
    throw new Error("Invalid comment.");
  }

  const details = await getAdminCommentDeleteDetails(currentUser.id, commentId);
  await deleteAdminComment(currentUser.id, commentId);

  revalidatePath("/admin/comments");
  revalidatePath("/dashboard");

  if (details) {
    revalidatePath(`/events/${details.eventId}`);
  }

  redirect("/admin/comments");
}

export async function deleteGroupAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  const groupId = Number(formData.get("groupId"));

  if (!Number.isInteger(groupId)) {
    throw new Error("Invalid group.");
  }

  await deleteAdminGroup(currentUser.id, groupId);
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/events");
  revalidatePath("/admin/comments");
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  redirect("/admin/groups");
}

export async function deleteEventAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  const eventId = Number(formData.get("eventId"));

  if (!Number.isInteger(eventId)) {
    throw new Error("Invalid event.");
  }

  const details = await getAdminEventDeleteDetails(currentUser.id, eventId);

  await deleteAdminEvent(currentUser.id, eventId);
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/admin/comments");
  revalidatePath("/dashboard");

  if (details) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/groups/${details.groupId}`);
  }

  redirect("/admin/events");
}
