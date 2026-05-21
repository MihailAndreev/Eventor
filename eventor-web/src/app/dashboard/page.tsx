import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DashboardViewTabs,
  GroupFilterTabs,
} from "@/components/events/dashboard-filters";
import { EventCard } from "@/components/events/event-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserDashboardEventsPage } from "@/services/events";
import type { DashboardView } from "@/components/events/dashboard-filters";

export const metadata = {
  title: "Dashboard | Eventor",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string | string[];
    group?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/dashboard");
  }

  const selectedView = getSelectedView(params.view);
  const requestedPage = getPositiveIntegerParam(params.page, 1);
  const requestedPageSize = getPositiveIntegerParam(params.pageSize, 10);
  const groupsResult = await getUserDashboardEventsPage(currentUser.id, {
    view: selectedView,
    page: 1,
    pageSize: requestedPageSize,
  });
  const { groups } = groupsResult;
  const requestedGroupSlug =
    typeof params.group === "string" ? params.group : undefined;
  const selectedGroup = groups.find((group) => group.slug === requestedGroupSlug);
  const selectedGroupSlug = selectedGroup?.slug;
  const initialDashboardPage = selectedGroup
    ? await getUserDashboardEventsPage(currentUser.id, {
        view: selectedView,
        groupId: selectedGroup.id,
        page: requestedPage,
        pageSize: requestedPageSize,
      })
    : requestedPage === 1
      ? groupsResult
      : await getUserDashboardEventsPage(currentUser.id, {
          view: selectedView,
          page: requestedPage,
          pageSize: requestedPageSize,
        });
  const dashboardPage =
    requestedPage > initialDashboardPage.totalPages && initialDashboardPage.total > 0
      ? await getUserDashboardEventsPage(currentUser.id, {
          view: selectedView,
          groupId: selectedGroup?.id,
          page: initialDashboardPage.totalPages,
          pageSize: initialDashboardPage.pageSize,
        })
      : initialDashboardPage;
  const pageTitle = selectedView === "active" ? "Active Events" : "Archived Events";
  const currentPage = Math.min(dashboardPage.page, dashboardPage.totalPages);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
            User Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {selectedView === "active"
              ? "Upcoming and current events from your groups."
              : "Past and canceled events from your groups."}
          </p>
        </div>

        <div className="grid gap-4">
          <DashboardViewTabs
            selectedView={selectedView}
            selectedGroupSlug={selectedGroupSlug}
            pageSize={dashboardPage.pageSize}
          />
          <GroupFilterTabs
            groups={groups}
            countsByGroup={dashboardPage.countsByGroup}
            allCount={dashboardPage.allCount}
            selectedView={selectedView}
            selectedGroupSlug={selectedGroupSlug}
            pageSize={dashboardPage.pageSize}
          />
        </div>

        {dashboardPage.events.length > 0 ? (
          <div className="grid gap-4">
            {dashboardPage.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                muted={selectedView === "archive"}
              />
            ))}
          </div>
        ) : (
          <EmptyEventsState
            selectedView={selectedView}
            selectedGroupTitle={selectedGroup?.title}
          />
        )}

        <DashboardPagination
          selectedView={selectedView}
          selectedGroupSlug={selectedGroupSlug}
          page={currentPage}
          pageSize={dashboardPage.pageSize}
          total={dashboardPage.total}
          totalPages={dashboardPage.totalPages}
        />
      </section>
    </div>
  );
}

function EmptyEventsState({
  selectedView,
  selectedGroupTitle,
}: {
  selectedView: DashboardView;
  selectedGroupTitle?: string;
}) {
  const scopedLabel = selectedGroupTitle ? ` in ${selectedGroupTitle}` : " found";
  const title =
    selectedView === "active"
      ? `No active events${scopedLabel}.`
      : `No archived events${scopedLabel}.`;
  const description =
    selectedView === "active"
      ? selectedGroupTitle
        ? "Upcoming and current events from this group will appear here."
        : "Upcoming and current events from your groups will appear here."
      : selectedGroupTitle
        ? "Past and canceled events from this group will appear here."
        : "Past and canceled events from your groups will appear here.";

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function getSelectedView(value: string | string[] | undefined): DashboardView {
  return value === "archive" ? "archive" : "active";
}

function DashboardPagination({
  selectedView,
  selectedGroupSlug,
  page,
  pageSize,
  total,
  totalPages,
}: {
  selectedView: DashboardView;
  selectedGroupSlug?: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Dashboard pagination"
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-slate-600">
        Page {page} of {totalPages}
        {total > 0 ? `, showing ${startItem}-${endItem} of ${total} events` : ""}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          href={getDashboardPageHref({
            view: selectedView,
            groupSlug: selectedGroupSlug,
            page: page - 1,
            pageSize,
          })}
          disabled={!hasPrevious}
        >
          Previous
        </PaginationLink>
        <PaginationLink
          href={getDashboardPageHref({
            view: selectedView,
            groupSlug: selectedGroupSlug,
            page: page + 1,
            pageSize,
          })}
          disabled={!hasNext}
        >
          Next
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  children,
  disabled,
  href,
}: {
  children: React.ReactNode;
  disabled: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
    >
      {children}
    </Link>
  );
}

function getDashboardPageHref({
  view,
  groupSlug,
  page,
  pageSize,
}: {
  view: DashboardView;
  groupSlug?: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();

  params.set("view", view);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (groupSlug) {
    params.set("group", groupSlug);
  }

  return `/dashboard?${params.toString()}`;
}

function getPositiveIntegerParam(
  value: string | string[] | undefined,
  fallback: number,
) {
  const parsed = Number(typeof value === "string" ? value : undefined);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
