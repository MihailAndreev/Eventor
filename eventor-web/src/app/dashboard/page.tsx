import { redirect } from "next/navigation";
import { EventCard } from "@/components/events/event-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserDashboardEvents } from "@/services/events";

export const metadata = {
  title: "Dashboard | Eventor",
};

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/dashboard");
  }

  const { activeEvents, archiveEvents } = await getUserDashboardEvents(currentUser.id);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            User Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Active Events
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Upcoming and current events from your groups.
          </p>
        </div>

        {activeEvents.length > 0 ? (
          <div className="grid gap-4">
            {activeEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState message="No active events in your groups right now." />
        )}
      </section>

      <section className="grid gap-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Archive Events
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Past and canceled events from your groups.
          </p>
        </div>

        {archiveEvents.length > 0 ? (
          <div className="grid gap-4 opacity-90">
            {archiveEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState message="No archived events yet." />
        )}
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
      {message}
    </div>
  );
}
