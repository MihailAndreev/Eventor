"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  deleteAdminComment,
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

  await deleteAdminComment(currentUser.id, commentId);
  revalidatePath("/admin/comments");
}
