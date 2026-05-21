import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  validateLoginInput,
  validateRegistrationInput,
} from "@/lib/validation/auth";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string };

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const validation = validateRegistrationInput(input);

  if (!validation.ok) {
    return validation;
  }

  const existingUser = await getUserByEmail(validation.email);

  if (existingUser) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(validation.password);
  const [createdUser] = await db
    .insert(users)
    .values({
      email: validation.email,
      name: validation.name,
      passwordHash,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

  return { ok: true, user: createdUser };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const validation = validateLoginInput(input);

  if (!validation.ok) {
    return validation;
  }

  const user = await getUserWithPasswordByEmail(validation.email);

  if (!user) {
    return { ok: false, message: "Invalid email or password." };
  }

  const passwordMatches = await verifyPassword(
    validation.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return { ok: false, message: "Invalid email or password." };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function getUserById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
}

async function getUserByEmail(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

async function getUserWithPasswordByEmail(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}
