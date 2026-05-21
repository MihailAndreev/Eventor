import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LeaveGroupForm } from "@/components/groups/leave-group-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserGroupAccess } from "@/services/groups";

export default async function LeaveGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${id}/leave`);
  }

  if (!Number.isInteger(groupId)) {
    notFound();
  }

  const access = await getUserGroupAccess(currentUser.id, groupId);

  if (!access.ok && access.reason === "not_found") {
    notFound();
  }

  if (!access.ok) {
    return <GroupAccessDenied />;
  }

  const { group } = access;
  const isOnlyManager = group.currentUserIsManager && group.managers.length <= 1;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/groups/${groupId}`}
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to group
      </Link>
      <section className="rounded-lg border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Leave Group
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {group.title}
          </h1>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-700">
            <p>
              Leaving means you will lose access to this group and it will no
              longer appear in your groups list.
            </p>
            <p>
              You may no longer see this group&apos;s events. Your participation
              in upcoming or current group events will be marked as not going,
              while past comments and history remain in place.
            </p>
          </div>
          {isOnlyManager ? (
            <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
              You are the only manager of this group. Promote another member to
              manager before leaving.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <LeaveGroupForm groupId={groupId} disabled={isOnlyManager} />
          <Link
            href={`/groups/${groupId}`}
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
          >
            Cancel
          </Link>
        </div>
      </section>
    </div>
  );
}

function GroupAccessDenied() {
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
          Group access required
        </h1>
        <p className="mt-2 text-sm leading-6 text-red-800">
          You are logged in, but you are not a member of this group.
        </p>
      </section>
    </div>
  );
}
