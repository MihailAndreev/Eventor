import { getApiUser } from "@/lib/api/auth";
import {
  apiError,
  apiJson,
  apiOptions,
  invalidEventIdResponse,
  parseEventId,
  serializeEventDetails,
} from "@/lib/api/responses";
import { getUserEventAccess } from "@/services/events";

export function OPTIONS() {
  return apiOptions();
}

export async function GET(
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

  const access = await getUserEventAccess(currentUser.id, eventId);

  if (!access.ok) {
    return access.reason === "not_member"
      ? apiError("You are not a member of this event group.", 403)
      : invalidEventIdResponse();
  }

  return apiJson({ data: serializeEventDetails(access.event) });
}
