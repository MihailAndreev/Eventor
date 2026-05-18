import { redirect } from "next/navigation";
import {
  DashboardViewTabs,
  GroupFilterTabs,
} from "@/components/events/dashboard-filters";
import { EventCard } from "@/components/events/event-card";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardEvent, getUserDashboardEvents } from "@/services/events";
import type { DashboardView } from "@/components/events/dashboard-filters";

export const metadata = {
  title: "Dashboard | Eventor",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[]; group?: string | string[] }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/dashboard");
  }

  const { groups, activeEvents, archiveEvents } = await getUserDashboardEvents(currentUser.id);
  const selectedView = getSelectedView(params.view);
  const requestedGroupSlug =
    typeof params.group === "string" ? params.group : undefined;
  const selectedGroup = groups.find((group) => group.slug === requestedGroupSlug);
  const selectedGroupSlug = selectedGroup?.slug;
  const viewEvents = selectedView === "active" ? activeEvents : archiveEvents;
  const visibleEvents = selectedGroupSlug
    ? viewEvents.filter((event) => event.groupSlug === selectedGroupSlug)
    : viewEvents;
  const countsByGroup = getGroupFilterCounts(viewEvents);
  const pageTitle = selectedView === "active" ? "Active Events" : "Archived Events";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
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
          />
          <GroupFilterTabs
            groups={groups}
            countsByGroup={countsByGroup}
            allCount={viewEvents.length}
            selectedView={selectedView}
            selectedGroupSlug={selectedGroupSlug}
          />
        </div>

        {visibleEvents.length > 0 ? (
          <div className="grid gap-4">
            {visibleEvents.map((event) => (
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

function getGroupFilterCounts(events: DashboardEvent[]) {
  const countsByGroup = new Map<string, number>();

  for (const event of events) {
    countsByGroup.set(event.groupSlug, (countsByGroup.get(event.groupSlug) ?? 0) + 1);
  }

  return countsByGroup;
}
