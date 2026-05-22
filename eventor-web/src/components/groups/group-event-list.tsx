import Link from "next/link";
import { CoverImage } from "@/components/media/cover-image-manager";
import type { GroupEventSummary } from "@/services/groups";

export function GroupEventList({
  events,
  groupId,
  canManageEvents = false,
}: {
  events: GroupEventSummary[];
  groupId: number;
  canManageEvents?: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-950">No events yet.</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Events created for this group will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <article
          key={event.id}
          className={`relative rounded-lg border border-slate-200 p-4 shadow-sm ${
            event.isActive ? "bg-white" : "bg-slate-50/80"
          }`}
        >
          <div
            className={`grid gap-4 sm:items-start ${
              event.coverImageUrl
                ? "sm:grid-cols-[132px_minmax(0,1fr)]"
                : "sm:grid-cols-[minmax(0,1fr)]"
            }`}
          >
            {event.coverImageUrl ? (
              <CoverImage
                src={event.coverImageUrl}
                alt={`${event.title} cover`}
                size="thumb"
              />
            ) : null}
            <div className="min-w-0 sm:pr-1">
              <div className="min-w-0 sm:max-w-[calc(100%-18rem)]">
                <div className="flex flex-wrap gap-2">
                  <EventStateBadge event={event} />
                  {event.canceled ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200">
                      canceled
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 truncate text-lg font-semibold tracking-tight text-slate-950">
                  {event.title}
                </h3>
              </div>
              <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                <MetaItem label="Date" value={formatDate(event.startAt)} />
                <MetaItem label="Time" value={formatTime(event.startAt)} />
                <MetaItem label="Location" value={event.location ?? "TBA"} />
              </dl>
              <p className="mt-3 text-sm text-slate-600">
                {getCapacityText(event)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:absolute sm:right-4 sm:top-4 sm:justify-end">
              <Link
                href={`/events/${event.id}`}
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View event
              </Link>
              {canManageEvents ? (
                <>
                  <Link
                    href={`/groups/${groupId}/events/${event.id}/edit`}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/groups/${groupId}/events/${event.id}/delete`}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                  >
                    Delete
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function EventStateBadge({ event }: { event: GroupEventSummary }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        event.isActive
          ? "bg-[#EAF5F8] text-[#004F6E] ring-[#B8D7E2]"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {event.isActive ? "active" : "archive"}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function getCapacityText(event: GroupEventSummary) {
  if (event.capacity === null) {
    return `${event.participantCount} joined, unlimited capacity`;
  }

  return `${event.participantCount} joined, ${event.attendeeCount} of ${event.capacity} spots used`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
