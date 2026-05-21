import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteEventForm } from "@/components/groups/delete-event-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getEventManagementAccess } from "@/services/events";

export default async function DeleteEventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId: eventParam } = await params;
  const groupId = Number(id);
  const eventId = Number(eventParam);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${id}/events/${eventParam}/delete`);
  }

  if (!Number.isInteger(groupId) || !Number.isInteger(eventId)) {
    notFound();
  }

  const access = await getEventManagementAccess(currentUser.id, groupId, eventId);

  if (!access.ok && access.reason === "not_found") {
    notFound();
  }

  if (!access.ok) {
    return <EventManagementDenied groupId={groupId} action="delete events" />;
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
            Delete Event
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {access.event.title}
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-red-800">
            This will permanently delete the event, its participants, and its
            comments. This action cannot be undone.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Confirm only if this activity should be removed from the group.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DeleteEventForm groupId={groupId} eventId={eventId} />
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

function EventManagementDenied({
  groupId,
  action,
}: {
  groupId: number;
  action: string;
}) {
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
          You are logged in, but only group managers can {action}.
        </p>
      </section>
    </div>
  );
}
