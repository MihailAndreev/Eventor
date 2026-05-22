import { getApiUser } from "@/lib/api/auth";
import { apiError, invalidEventIdResponse, parseEventId } from "@/lib/api/responses";
import { addEventComment } from "@/services/events";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getApiUser(request);

  if (!currentUser) {
    return apiError("Missing or invalid bearer token.", 401);
  }

  const { id } = await params;
  const eventId = parseEventId(id);

  if (eventId === null) {
    return invalidEventIdResponse();
  }

  const body = await getJsonBody(request);

  if (!body.ok) {
    return apiError(body.message);
  }

  const result = await addEventComment(
    currentUser.id,
    eventId,
    getStringField(body.value, "text"),
  );

  if (!result.ok) {
    return apiError(result.message, getCommentStatus(result.message));
  }

  return Response.json(result);
}

function getCommentStatus(message: string) {
  if (message === "Event not found.") {
    return 404;
  }

  if (message === "You are not a member of this event group.") {
    return 403;
  }

  return 400;
}

async function getJsonBody(request: Request) {
  try {
    return { ok: true as const, value: await request.json() };
  } catch {
    return { ok: false as const, message: "Request body must be valid JSON." };
  }
}

function getStringField(body: unknown, key: string) {
  if (!body || typeof body !== "object" || !(key in body)) {
    return "";
  }

  const value = body[key as keyof typeof body];

  return typeof value === "string" ? value : "";
}
