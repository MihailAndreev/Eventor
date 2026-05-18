import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventDetails } from "@/components/events/event-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserEventAccess } from "@/services/events";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${id}`);
  }

  if (!Number.isInteger(eventId)) {
    notFound();
  }

  const access = await getUserEventAccess(currentUser.id, eventId);

  if (!access.ok && access.reason === "not_found") {
    notFound();
  }

  if (!access.ok) {
    return (
      <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
        >
          Back to dashboard
        </Link>
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold tracking-tight text-red-900">
            Event unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-red-800">
            You are not a member of the group that owns this event.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to dashboard
      </Link>
      <EventDetails event={access.event} />
    </div>
  );
}
