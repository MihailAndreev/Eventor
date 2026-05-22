import { getApiUser } from "@/lib/api/auth";
import { apiError } from "@/lib/api/responses";
import { getUserNotificationsPage } from "@/services/notifications";

export async function GET(request: Request) {
  const currentUser = await getApiUser(request);

  if (!currentUser) {
    return apiError("Missing or invalid bearer token.", 401);
  }

  const url = new URL(request.url);
  const page = getPositiveIntegerQueryParam(url, "page", 1);
  const pageSize = getPositiveIntegerQueryParam(url, "pageSize", 20);
  const result = await getUserNotificationsPage(currentUser.id, { page, pageSize });

  return Response.json({
    data: result.notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      text: notification.text,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      groupId: notification.groupId,
      eventId: notification.eventId,
    })),
    paging: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

function getPositiveIntegerQueryParam(
  url: URL,
  key: string,
  fallback: number,
) {
  const value = Number(url.searchParams.get(key) ?? fallback);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}
