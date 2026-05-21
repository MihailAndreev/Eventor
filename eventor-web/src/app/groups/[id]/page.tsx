import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GroupEventList } from "@/components/groups/group-event-list";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserGroupAccess } from "@/services/groups";
import type { GroupMemberSummary } from "@/services/groups";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${id}`);
  }

  if (!Number.isInteger(groupId)) {
    notFound();
  }

  const access = await getUserGroupAccess(currentUser.id, groupId);

  if (!access.ok && access.reason === "not_found") {
    notFound();
  }

  if (!access.ok) {
    return (
      <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
        <Link
          href="/groups"
          className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
        >
          Back to groups
        </Link>
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold tracking-tight text-red-900">
            Group unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-red-800">
            You are logged in, but you are not a member of this group.
          </p>
        </section>
      </div>
    );
  }

  const { group } = access;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href="/groups"
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to groups
      </Link>

      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
              Group
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {group.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              {group.description ?? "No description yet."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <span
              className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
                group.currentUserIsManager
                  ? "bg-[#EAF5F8] text-[#004F6E] ring-[#B8D7E2]"
                  : "bg-slate-100 text-slate-700 ring-slate-200"
              }`}
            >
              You are a {group.currentUserIsManager ? "manager" : "member"}
            </span>
            {group.currentUserIsManager ? (
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link
                  href={`/groups/${group.id}/events/new`}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Create Event
                </Link>
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
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <main className="grid gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">Events</h2>
              <p className="mt-1 text-sm text-slate-600">
                Activities planned inside this group.
              </p>
            </div>
            <GroupEventList
              events={group.events}
              groupId={group.id}
              canManageEvents={group.currentUserIsManager}
            />
          </section>
        </main>

        <aside className="grid gap-4 lg:sticky lg:top-6">
          <MemberSection title="Managers" members={group.managers} />
          <MemberSection title="Members" members={group.members} />
        </aside>
      </div>
    </div>
  );
}

function MemberSection({
  title,
  members,
}: {
  title: string;
  members: GroupMemberSummary[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {members.length} {members.length === 1 ? "person" : "people"}
        </p>
      </div>
      {members.length > 0 ? (
        <ul className="grid gap-2">
          {members.map((member) => (
            <li
              key={`${title}-${member.id}`}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.email}</p>
                </div>
                {member.isManager ? (
                  <span className="shrink-0 rounded-full bg-[#EAF5F8] px-2 py-0.5 text-xs font-semibold text-[#004F6E] ring-1 ring-[#B8D7E2]">
                    Manager
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No people to show.</p>
      )}
    </section>
  );
}
