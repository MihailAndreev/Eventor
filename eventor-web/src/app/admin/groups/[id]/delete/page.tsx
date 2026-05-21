import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminAccessDenied, formatDate } from "../../../_components";
import { deleteGroupAction } from "../../../actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminGroupDeleteDetails } from "@/services/admin";

export const metadata = {
  title: "Delete Group | Eventor Admin",
};

export default async function DeleteAdminGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/admin/groups/${id}/delete`);
  }

  if (currentUser.role !== "admin") {
    return <AdminAccessDenied />;
  }

  if (!Number.isInteger(groupId)) {
    notFound();
  }

  const group = await getAdminGroupDeleteDetails(currentUser.id, groupId);

  if (!group) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin/groups"
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to groups
      </Link>
      <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
          Delete Group
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {group.title}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-800">
          This will permanently delete the group and related data through
          database cascade relationships. This action cannot be undone.
        </p>
        <dl className="mt-5 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <ConfirmStat label="Members" value={group.memberCount} />
          <ConfirmStat label="Managers" value={group.managerCount} />
          <ConfirmStat label="Invites" value={group.inviteCount} />
          <ConfirmStat label="Events" value={group.eventCount} />
          <ConfirmStat label="Event participants" value={group.eventParticipantCount} />
          <ConfirmStat label="Event comments" value={group.eventCommentCount} />
          <ConfirmStat label="Event links" value={group.eventLinkCount} />
          <ConfirmStat label="Notifications" value={group.notificationCount} />
          <div>
            <dt className="font-semibold text-slate-500">Created</dt>
            <dd className="mt-1 text-slate-950">{formatDate(group.createdAt)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          Related group members, group invites, group events, event
          participants, event comments, event links, notifications, and cover
          image metadata will be removed. Existing cover image objects are
          cleaned up from storage after the database deletion when possible.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action={deleteGroupAction}>
            <input type="hidden" name="groupId" value={group.id} />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Confirm Delete
            </button>
          </form>
          <Link
            href="/admin/groups"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
          >
            Cancel
          </Link>
        </div>
      </section>
    </div>
  );
}

function ConfirmStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-950">{value}</dd>
    </div>
  );
}
