import { signSessionToken } from "@/lib/auth/jwt";
import { apiError } from "@/lib/api/responses";
import { loginUser } from "@/services/users";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON.");
  }

  const email = getStringField(body, "email");
  const password = getStringField(body, "password");

  const result = await loginUser({ email, password });

  if (!result.ok) {
    return apiError(result.message, 401);
  }

  const token = await signSessionToken({
    userId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
  });

  return Response.json({
    token,
    tokenType: "Bearer",
    user: result.user,
  });
}

function getStringField(body: unknown, key: string) {
  if (!body || typeof body !== "object" || !(key in body)) {
    return "";
  }

  const value = body[key as keyof typeof body];

  return typeof value === "string" ? value : "";
}
