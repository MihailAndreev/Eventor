import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteGroupForm } from "@/components/groups/delete-group-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserGroupManagementAccess } from "@/services/groups";

export default async function DeleteGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${id}/delete`);
  }

  if (!Number.isInteger(groupId)) {
    notFound();
  }

  const access = await getUserGroupManagementAccess(currentUser.id, groupId);

  if (!access.ok && access.reason === "not_found") {
    notFound();
  }

  if (!access.ok) {
    return <GroupManagementDenied groupId={groupId} />;
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/groups/${groupId}`}
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to group
      </Link>
      <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
            Delete Group
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {access.group.title}
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-red-800">
            This will permanently delete the group, its events, participants,
            comments, invites, and related notifications. This action cannot be
            undone.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Confirm only if you are sure this community and its related activity
            should be removed.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DeleteGroupForm groupId={groupId} />
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
          You are logged in, but only group managers can delete this group.
        </p>
      </section>
    </div>
  );
}
