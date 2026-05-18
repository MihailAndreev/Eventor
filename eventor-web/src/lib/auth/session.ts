import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./constants";
import {
  SessionPayload,
  signSessionToken,
  verifySessionToken,
} from "./jwt";
import { getUserById } from "@/services/users";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function createSession(payload: SessionPayload) {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions);
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  return getUserById(session.userId);
});
