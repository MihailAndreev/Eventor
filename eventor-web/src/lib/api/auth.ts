import "server-only";

import { verifySessionToken } from "@/lib/auth/jwt";
import { getUserById } from "@/services/users";

export async function getApiUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  return getUserById(session.userId);
}
