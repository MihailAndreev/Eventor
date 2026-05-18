import { jwtVerify, SignJWT } from "jose";
import { SESSION_MAX_AGE_SECONDS } from "./constants";

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
  role: "user" | "admin";
};

const encodedSecret = new TextEncoder().encode(getJwtSecret());

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(encodedSecret);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    const userId = Number(payload.userId);

    if (
      !Number.isInteger(userId) ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }

    return {
      userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    } satisfies SessionPayload;
  } catch {
    return null;
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required.");
  }

  return secret;
}
