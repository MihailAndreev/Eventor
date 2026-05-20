import { getApiUser } from "@/lib/api/auth";
import { apiError, apiJson, apiOptions, serializeEventListItem } from "@/lib/api/responses";
import { getUserActiveEventsPage } from "@/services/events";

export function OPTIONS() {
  return apiOptions();
}

export async function GET(request: Request) {
  const currentUser = await getApiUser(request);

  if (!currentUser) {
    return apiError("Missing or invalid bearer token.", 401);
  }

  const url = new URL(request.url);
  const page = getPositiveIntegerQueryParam(url, "page", 1);
  const pageSize = getPositiveIntegerQueryParam(url, "pageSize", 20);
  const result = await getUserActiveEventsPage(currentUser.id, { page, pageSize });

  return apiJson({
    data: result.events.map(serializeEventListItem),
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
