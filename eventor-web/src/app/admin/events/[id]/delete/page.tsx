import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminAccessDenied } from "../../../_components";
import { deleteEventAction } from "../../../actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminEventDeleteDetails } from "@/services/admin";

export const metadata = {
  title: "Delete Event | Eventor Admin",
};

export default async function DeleteAdminEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/admin/events/${id}/delete`);
  }

  if (currentUser.role !== "admin") {
    return <AdminAccessDenied />;
  }

  if (!Number.isInteger(eventId)) {
    notFound();
  }

  const event = await getAdminEventDeleteDetails(currentUser.id, eventId);

  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin/events"
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to events
      </Link>
      <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
          Delete Event
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {event.title}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-800">
          This will permanently delete the event and related data through
          database cascade relationships. This action cannot be undone.
        </p>
        <dl className="mt-5 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <ConfirmStat label="Group" value={event.groupTitle} />
          <ConfirmStat
            label="Date/time"
            value={`${event.eventDate} ${event.eventTime.slice(0, 5)}`}
          />
          <ConfirmStat label="State" value={event.canceled ? "Canceled" : "Open"} />
          <ConfirmStat label="Participants" value={String(event.participantCount)} />
          <ConfirmStat label="Comments" value={String(event.commentCount)} />
          <ConfirmStat label="Links" value={String(event.linkCount)} />
        </dl>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          Participants, comments, event links, notifications, and event cover
          image metadata will be removed. The event cover image object is
          cleaned up from storage after the database deletion when possible.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action={deleteEventAction}>
            <input type="hidden" name="eventId" value={event.id} />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Confirm Delete
            </button>
          </form>
          <Link
            href="/admin/events"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
          >
            Cancel
          </Link>
        </div>
      </section>
    </div>
  );
}

function ConfirmStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-950">{value}</dd>
    </div>
  );
}
