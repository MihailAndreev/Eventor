import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventDetails } from "@/components/events/event-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserEventById } from "@/services/events";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/dashboard");
  }

  const { id } = await params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    notFound();
  }

  const event = await getUserEventById(currentUser.id, eventId);

  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to dashboard
      </Link>
      <EventDetails event={event} />
    </div>
  );
}
