import { getApiUser } from "@/lib/api/auth";
import { apiError } from "@/lib/api/responses";
import { markNotificationRead } from "@/services/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getApiUser(request);

  if (!currentUser) {
    return apiError("Missing or invalid bearer token.", 401);
  }

  const { id } = await params;
  const notificationId = parseNotificationId(id);

  if (notificationId === null) {
    return apiError("Notification not found.", 404);
  }

  const result = await markNotificationRead(currentUser.id, notificationId);

  if (!result.ok) {
    return apiError("Notification not found.", 404);
  }

  return Response.json(result);
}

function parseNotificationId(value: string) {
  const notificationId = Number(value);

  return Number.isInteger(notificationId) && notificationId > 0 ? notificationId : null;
}
