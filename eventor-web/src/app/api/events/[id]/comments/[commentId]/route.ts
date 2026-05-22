import { getApiUser } from "@/lib/api/auth";
import { apiError, invalidEventIdResponse, parseEventId } from "@/lib/api/responses";
import { deleteEventComment, updateEventComment } from "@/services/events";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const currentUser = await getApiUser(request);

  if (!currentUser) {
    return apiError("Missing or invalid bearer token.", 401);
  }

  const { id, commentId } = await params;
  const parsedIds = parseIds(id, commentId);

  if (!parsedIds) {
    return invalidEventIdResponse();
  }

  const body = await getJsonBody(request);

  if (!body.ok) {
    return apiError(body.message);
  }

  const result = await updateEventComment(
    currentUser.id,
    parsedIds.eventId,
    parsedIds.commentId,
    getStringField(body.value, "text"),
  );

  if (!result.ok) {
    return apiError(result.message, getCommentStatus(result.message));
  }

  return Response.json(result);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const currentUser = await getApiUser(request);

  if (!currentUser) {
    return apiError("Missing or invalid bearer token.", 401);
  }

  const { id, commentId } = await params;
  const parsedIds = parseIds(id, commentId);

  if (!parsedIds) {
    return invalidEventIdResponse();
  }

  const result = await deleteEventComment(
    currentUser.id,
    parsedIds.eventId,
    parsedIds.commentId,
  );

  if (!result.ok) {
    return apiError(result.message, getCommentStatus(result.message));
  }

  return Response.json(result);
}

function parseIds(id: string, commentId: string) {
  const eventId = parseEventId(id);
  const parsedCommentId = parseEventId(commentId);

  if (eventId === null || parsedCommentId === null) {
    return null;
  }

  return { eventId, commentId: parsedCommentId };
}

function getCommentStatus(message: string) {
  if (message === "Event not found." || message === "Comment not found.") {
    return 404;
  }

  if (
    message === "You are not a member of this event group." ||
    message === "You can only edit your own comments." ||
    message === "You can only delete comments you own."
  ) {
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
