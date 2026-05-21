import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  MemberManagementList,
  type ManagedMember,
} from "@/components/groups/member-management-list";
import { getCurrentUser } from "@/lib/auth/session";
import { getGroupMembersManagement } from "@/services/groups";

export default async function ManageGroupMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${id}/members`);
  }

  if (!Number.isInteger(groupId)) {
    notFound();
  }

  const access = await getGroupMembersManagement(currentUser.id, groupId);

  if (!access.ok && access.reason === "not_found") {
    notFound();
  }

  if (!access.ok) {
    return <GroupManagementDenied groupId={groupId} />;
  }

  const members = access.group.members.map(
    (member): ManagedMember => ({
      ...member,
      joinedAt: member.joinedAt.toISOString(),
    }),
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/groups/${groupId}`}
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to group
      </Link>

      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
              Manage Members
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {access.group.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Promote members to managers, demote managers, or remove members
              from this group. Eventor keeps at least one manager in every
              group.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#EAF5F8] px-3 py-1.5 text-sm font-semibold text-[#004F6E] ring-1 ring-[#B8D7E2]">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        </div>
      </header>

      <MemberManagementList
        groupId={groupId}
        currentUserId={currentUser.id}
        members={members}
      />
    </div>
  );
}

function GroupManagementDenied({ groupId }: { groupId: number }) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/groups/${groupId}`}
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to group
      </Link>
      <section className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-2xl font-bold tracking-tight text-red-900">
          Manager access required
        </h1>
        <p className="mt-2 text-sm leading-6 text-red-800">
          You are logged in, but only group managers can manage group members.
        </p>
      </section>
    </div>
  );
}
