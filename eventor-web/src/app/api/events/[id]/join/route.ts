import { getApiUser } from "@/lib/api/auth";
import { apiError, invalidEventIdResponse, parseEventId } from "@/lib/api/responses";
import { joinEvent } from "@/services/events";

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

  const result = await joinEvent(currentUser.id, eventId);

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
