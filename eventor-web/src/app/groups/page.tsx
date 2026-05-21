import Link from "next/link";
import { redirect } from "next/navigation";
import { CoverImage } from "@/components/media/cover-image-manager";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserGroupsPage } from "@/services/groups";

export const metadata = {
  title: "Groups | Eventor",
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    q?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/groups");
  }

  const q = getStringParam(params.q);
  const initialGroupsPage = await getUserGroupsPage(currentUser.id, {
    page: getPositiveIntegerParam(params.page, 1),
    pageSize: getPositiveIntegerParam(params.pageSize, 20),
    search: q,
  });
  const groupsPage =
    initialGroupsPage.page > initialGroupsPage.totalPages && initialGroupsPage.total > 0
      ? await getUserGroupsPage(currentUser.id, {
          page: initialGroupsPage.totalPages,
          pageSize: initialGroupsPage.pageSize,
          search: q,
        })
      : initialGroupsPage;
  const groups = groupsPage.groups;
  const currentPage = Math.min(groupsPage.page, groupsPage.totalPages);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
              Groups
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Your Communities
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Permanent groups for the people you plan recurring events with.
            </p>
          </div>
          <Link
            href="/groups/new"
            className="inline-flex h-11 w-fit items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            New Group
          </Link>
        </div>

        <form action="/groups" className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search your groups"
            className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#0B6B8A] focus:ring-4 focus:ring-[#D5E8EF]"
          />
          <input type="hidden" name="pageSize" value={groupsPage.pageSize} />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Search
          </button>
          {q ? (
            <Link
              href="/groups"
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
            >
              Clear
            </Link>
          ) : null}
        </form>

        {groups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <article
                key={group.id}
                className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7FB3C4] hover:shadow-md"
              >
                <CoverImage
                  src={group.coverImageUrl}
                  alt={`${group.title} cover`}
                  size="card"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/groups/${group.id}`} className="group/link">
                      <h2 className="text-xl font-semibold tracking-tight text-slate-950 transition group-hover/link:text-[#004F6E]">
                        {group.title}
                      </h2>
                    </Link>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {group.description ?? "No description yet."}
                    </p>
                  </div>
                  <span
                    className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                      group.currentUserIsManager
                        ? "bg-[#EAF5F8] text-[#004F6E] ring-[#B8D7E2]"
                        : "bg-slate-100 text-slate-700 ring-slate-200"
                    }`}
                  >
                    {group.currentUserIsManager ? "Manager" : "Member"}
                  </span>
                </div>
                <dl className="mt-5 grid gap-2 sm:grid-cols-2">
                  <StatItem label="Members" value={String(group.memberCount)} />
                  <StatItem
                    label="Active events"
                    value={String(group.activeEventCount)}
                  />
                </dl>
                {group.currentUserIsManager ? (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                    <Link
                      href={`/groups/${group.id}/edit`}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/groups/${group.id}/delete`}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                    >
                      Delete
                    </Link>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              You are not in any groups yet.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Groups you join or manage will appear here.
            </p>
          </div>
        )}

        <GroupsPagination
          page={currentPage}
          pageSize={groupsPage.pageSize}
          total={groupsPage.total}
          totalPages={groupsPage.totalPages}
          q={q}
        />
      </section>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function GroupsPagination({
  page,
  pageSize,
  total,
  totalPages,
  q,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  q?: string;
}) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Groups pagination"
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-slate-600">
        Page {page} of {totalPages}
        {total > 0 ? `, showing ${startItem}-${endItem} of ${total} groups` : ""}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          href={getGroupsPageHref({ page: page - 1, pageSize, q })}
          disabled={!hasPrevious}
        >
          Previous
        </PaginationLink>
        <PaginationLink
          href={getGroupsPageHref({ page: page + 1, pageSize, q })}
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

function getGroupsPageHref({
  page,
  pageSize,
  q,
}: {
  page: number;
  pageSize: number;
  q?: string;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (q) {
    params.set("q", q);
  }

  return `/groups?${params.toString()}`;
}

function getPositiveIntegerParam(
  value: string | string[] | undefined,
  fallback: number,
) {
  const parsed = Number(typeof value === "string" ? value : undefined);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringParam(value: string | string[] | undefined) {
  const stringValue = typeof value === "string" ? value.trim() : "";

  return stringValue ? stringValue.slice(0, 120) : undefined;
}
