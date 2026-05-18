import Link from "next/link";
import type { DashboardGroup } from "@/services/events";

export type DashboardView = "active" | "archive";

type DashboardViewTabsProps = {
  selectedView: DashboardView;
  selectedGroupSlug?: string;
};

type GroupFilterTabsProps = {
  groups: DashboardGroup[];
  countsByGroup: Map<string, number>;
  allCount: number;
  selectedView: DashboardView;
  selectedGroupSlug?: string;
};

export function DashboardViewTabs({
  selectedView,
  selectedGroupSlug,
}: DashboardViewTabsProps) {
  const views: Array<{ value: DashboardView; label: string }> = [
    { value: "active", label: "Active Events" },
    { value: "archive", label: "Archive Events" },
  ];

  return (
    <nav
      aria-label="Dashboard event view"
      className="flex w-full gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
    >
      {views.map((view) => {
        const active = selectedView === view.value;

        return (
          <Link
            key={view.value}
            href={getDashboardHref(view.value, selectedGroupSlug)}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function GroupFilterTabs({
  groups,
  countsByGroup,
  allCount,
  selectedView,
  selectedGroupSlug,
}: GroupFilterTabsProps) {
  return (
    <nav
      aria-label="Dashboard group filter"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      <Link
        href={getDashboardHref(selectedView)}
        aria-current={!selectedGroupSlug ? "page" : undefined}
        className={getGroupTabClass(!selectedGroupSlug)}
      >
        All groups ({allCount})
      </Link>
      {groups.map((group) => {
        const active = selectedGroupSlug === group.slug;

        return (
          <Link
            key={group.id}
            href={getDashboardHref(selectedView, group.slug)}
            aria-current={active ? "page" : undefined}
            className={getGroupTabClass(active)}
          >
            {group.title} ({countsByGroup.get(group.slug) ?? 0})
          </Link>
        );
      })}
    </nav>
  );
}

function getDashboardHref(view: DashboardView, groupSlug?: string) {
  const params = new URLSearchParams();

  params.set("view", view);

  if (groupSlug) {
    params.set("group", groupSlug);
  }

  return `/dashboard?${params.toString()}`;
}

function getGroupTabClass(active: boolean) {
  return `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
    active
      ? "bg-emerald-600 text-white ring-emerald-600"
      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 hover:text-slate-950"
  }`;
}
