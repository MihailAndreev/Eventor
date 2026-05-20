import { getApiUser } from "@/lib/api/auth";
import { apiError, apiJson, apiOptions, invalidEventIdResponse, parseEventId } from "@/lib/api/responses";
import { leaveEvent } from "@/services/events";

export function OPTIONS() {
  return apiOptions();
}

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

  const result = await leaveEvent(currentUser.id, eventId);

  return apiJson(result, { status: result.ok ? 200 : 400 });
}
