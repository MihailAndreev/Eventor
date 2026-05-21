import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AdminAccessDenied,
  AdminPagination,
  AdminSearch,
  AdminShell,
  getPositiveIntegerParam,
  getStringParam,
} from "../_components";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminEventsPage } from "@/services/admin";

export const metadata = {
  title: "Admin Events | Eventor",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    q?: string | string[];
    view?: string | string[];
    canceled?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/admin");
  }

  if (currentUser.role !== "admin") {
    return <AdminAccessDenied />;
  }

  const q = getStringParam(params.q);
  const view = getViewParam(params.view);
  const canceled = getCanceledParam(params.canceled);
  const eventsPage = await getAdminEventsPage(currentUser.id, {
    page: getPositiveIntegerParam(params.page, 1),
    pageSize: getPositiveIntegerParam(params.pageSize, 20),
    search: q,
    view,
    canceled,
  });

  return (
    <AdminShell
      title="Events"
      description="Read-only event inventory with participation, comment, and link counts."
    >
      <AdminSearch action="/admin/events" defaultValue={q} placeholder="Search event or group" />
      <div className="flex flex-wrap gap-2 text-sm font-semibold">
        <FilterLink label="All" href={getFilterHref({ q, canceled })} active={!view} />
        <FilterLink label="Active" href={getFilterHref({ q, view: "active", canceled })} active={view === "active"} />
        <FilterLink label="Archive" href={getFilterHref({ q, view: "archive", canceled })} active={view === "archive"} />
        <FilterLink label="Canceled" href={getFilterHref({ q, view, canceled: "yes" })} active={canceled === "yes"} />
        <FilterLink label="Not canceled" href={getFilterHref({ q, view, canceled: "no" })} active={canceled === "no"} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Date/time</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Participants</th>
              <th className="px-4 py-3">Comments</th>
              <th className="px-4 py-3">Links</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {eventsPage.items.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{event.id}</td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/events/${event.id}`} className="text-[#004F6E] hover:underline">
                    {event.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/groups/${event.groupId}`} className="text-slate-800 hover:underline">
                    {event.groupTitle}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {event.eventDate} {event.eventTime.slice(0, 5)}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.canceled ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {event.canceled ? "Canceled" : "Open"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{event.participantCount}</td>
                <td className="px-4 py-3 text-slate-700">{event.commentCount}</td>
                <td className="px-4 py-3 text-slate-700">{event.linkCount}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/events/${event.id}/delete`}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                  >
                    Delete
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination
        basePath="/admin/events"
        page={eventsPage.page}
        pageSize={eventsPage.pageSize}
        total={eventsPage.total}
        totalPages={eventsPage.totalPages}
        query={{ q, view, canceled }}
      />
    </AdminShell>
  );
}

function FilterLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-2 transition ${
        active
          ? "border-[#0B6B8A] bg-[#EAF5F8] text-[#004F6E]"
          : "border-slate-200 bg-white text-slate-700 hover:border-[#7FB3C4]"
      }`}
    >
      {label}
    </Link>
  );
}

function getFilterHref({
  q,
  view,
  canceled,
}: {
  q?: string;
  view?: string;
  canceled?: string;
}) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (view) params.set("view", view);
  if (canceled) params.set("canceled", canceled);

  return `/admin/events${params.size > 0 ? `?${params.toString()}` : ""}`;
}

function getViewParam(value: string | string[] | undefined) {
  return value === "active" || value === "archive" ? value : undefined;
}

function getCanceledParam(value: string | string[] | undefined) {
  return value === "yes" || value === "no" ? value : undefined;
}
