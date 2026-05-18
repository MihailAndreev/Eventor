import "server-only";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string };

const PASSWORD_MIN_LENGTH = 8;

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (name.length < 2) {
    return { ok: false, message: "Enter your full name." };
  }

  if (!isValidEmail(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [createdUser] = await db
    .insert(users)
    .values({
      email,
      name,
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
  const email = normalizeEmail(input.email);

  if (!isValidEmail(email) || input.password.length === 0) {
    return { ok: false, message: "Invalid email or password." };
  }

  const user = await getUserWithPasswordByEmail(email);

  if (!user) {
    return { ok: false, message: "Invalid email or password." };
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
