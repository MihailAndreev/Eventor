import { getApiUser } from "@/lib/api/auth";
import { apiError, invalidEventIdResponse, parseEventId } from "@/lib/api/responses";
import { updateEventExtraSlots } from "@/services/events";

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

  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON.");
  }

  const extraSlots = getExtraSlots(body);

  if (extraSlots === null) {
    return apiError("extraSlots must be a non-negative integer.");
  }

  const result = await updateEventExtraSlots(currentUser.id, eventId, extraSlots);

  return Response.json(result, { status: result.ok ? 200 : 400 });
}

function getExtraSlots(body: unknown) {
  if (!body || typeof body !== "object" || !("extraSlots" in body)) {
    return null;
  }

  const value = Number(body.extraSlots);

  return Number.isInteger(value) && value >= 0 ? value : null;
}
