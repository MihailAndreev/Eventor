"use server";

import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginUser, registerUser } from "@/services/users";
import type { AuthActionState } from "./types";

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = await loginUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!result.ok) {
    return { message: result.message };
  }

  await createSession({
    userId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
  });

  redirect(safeRedirectPath(String(formData.get("redirectTo") ?? "/dashboard")));
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = await registerUser({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!result.ok) {
    return { message: result.message };
  }

  await createSession({
    userId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
