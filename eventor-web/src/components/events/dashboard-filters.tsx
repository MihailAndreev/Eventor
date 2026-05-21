import Link from "next/link";
import { GroupFilterSelect } from "@/components/events/group-filter-select";
import type { DashboardGroup } from "@/services/events";

export type DashboardView = "active" | "archive";

type DashboardViewTabsProps = {
  selectedView: DashboardView;
  selectedGroupSlug?: string;
  pageSize: number;
};

type GroupFilterTabsProps = {
  groups: DashboardGroup[];
  countsByGroup: Map<string, number>;
  allCount: number;
  selectedView: DashboardView;
  selectedGroupSlug?: string;
  pageSize: number;
};

export function DashboardViewTabs({
  selectedView,
  selectedGroupSlug,
  pageSize,
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
            href={getDashboardHref({
              view: view.value,
              groupSlug: selectedGroupSlug,
              pageSize,
            })}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-[#004F6E] text-white shadow-sm"
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
  pageSize,
}: GroupFilterTabsProps) {
  const allGroupsHref = getDashboardHref({ view: selectedView, pageSize });
  const options = [
    { href: allGroupsHref, key: "all-groups", label: `All groups (${allCount})` },
    ...groups.map((group) => ({
      href: getDashboardHref({
        view: selectedView,
        groupSlug: group.slug,
        pageSize,
      }),
      key: `group-${group.id}`,
      label: `${group.title} (${countsByGroup.get(group.slug) ?? 0})`,
    })),
  ];
  const selectedHref = selectedGroupSlug
    ? getDashboardHref({
        view: selectedView,
        groupSlug: selectedGroupSlug,
        pageSize,
      })
    : allGroupsHref;

  return (
    <>
      <div className="sm:hidden">
        <GroupFilterSelect options={options} selectedHref={selectedHref} />
      </div>
      <nav
        aria-label="Dashboard group filter"
        className="hidden flex-wrap gap-2 sm:flex"
      >
        <Link
          href={allGroupsHref}
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
              href={getDashboardHref({
                view: selectedView,
                groupSlug: group.slug,
                pageSize,
              })}
              aria-current={active ? "page" : undefined}
              className={getGroupTabClass(active)}
            >
              {group.title} ({countsByGroup.get(group.slug) ?? 0})
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function getDashboardHref({
  view,
  groupSlug,
  page = 1,
  pageSize,
}: {
  view: DashboardView;
  groupSlug?: string;
  page?: number;
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

function getGroupTabClass(active: boolean) {
  return `shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
    active
      ? "bg-[#004F6E] text-white ring-[#004F6E]"
      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 hover:text-slate-950"
  }`;
}
