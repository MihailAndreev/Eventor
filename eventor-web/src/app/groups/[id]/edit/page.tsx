import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GroupForm } from "@/components/groups/group-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserGroupManagementAccess } from "@/services/groups";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${id}/edit`);
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
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
            Edit Group
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {access.group.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Update the group title and description.
          </p>
        </div>
        <GroupForm
          mode="edit"
          groupId={groupId}
          initialTitle={access.group.title}
          initialDescription={access.group.description}
        />
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
          You are logged in, but only group managers can edit this group.
        </p>
      </section>
    </div>
  );
}
