import Link from "next/link";
import {
  DashboardEvent,
  getCapacityLabel,
} from "@/services/events";

type EventCardProps = {
  event: DashboardEvent;
};

const timeStateStyles = {
  upcoming: "bg-sky-50 text-sky-800 ring-sky-200",
  current: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  past: "bg-slate-100 text-slate-700 ring-slate-200",
};

const capacityStateStyles = {
  unlimited: "bg-violet-50 text-violet-800 ring-violet-200",
  under_capacity: "bg-teal-50 text-teal-800 ring-teal-200",
  full_capacity: "bg-amber-50 text-amber-800 ring-amber-200",
  over_capacity: "bg-red-50 text-red-800 ring-red-200",
};

export function EventCard({ event }: EventCardProps) {
  const dateLabel = formatDate(event.startAt);
  const timeLabel = formatTime(event.startAt);
  const capacityLabel = getCapacityLabel(event);

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      <article className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">
              {event.groupTitle}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              {event.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={timeStateStyles[event.timeState]}>
              {event.timeState}
            </Badge>
            {event.canceled ? (
              <Badge className="bg-red-50 text-red-800 ring-red-200">
                canceled
              </Badge>
            ) : null}
            <Badge className={capacityStateStyles[event.capacityState]}>
              {capacityLabel}
            </Badge>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          <p>
            <span className="font-semibold text-slate-900">Date:</span>{" "}
            {dateLabel}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Time:</span>{" "}
            {timeLabel}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Location:</span>{" "}
            {event.location ?? "TBA"}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Comments:</span>{" "}
            {event.commentsCount}
          </p>
        </div>

        <div className="grid gap-2 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-900">Participants:</span>{" "}
            {event.participantCount}
            {event.capacity === null
              ? " joined"
              : ` joined, ${event.attendeeCount} of ${event.capacity} spots used`}
          </p>
          <ParticipantList participants={event.participants} />
        </div>
      </article>
    </Link>
  );
}

export function EventDetails({ event }: { event: DashboardEvent }) {
  return (
    <article className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {event.groupTitle}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {event.title}
          </h1>
          {event.description ? (
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              {event.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={timeStateStyles[event.timeState]}>
            {event.timeState}
          </Badge>
          {event.canceled ? (
            <Badge className="bg-red-50 text-red-800 ring-red-200">
              canceled
            </Badge>
          ) : null}
          <Badge className={capacityStateStyles[event.capacityState]}>
            {getCapacityLabel(event)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Date" value={formatDate(event.startAt)} />
        <Detail label="Time" value={formatTime(event.startAt)} />
        <Detail label="Location" value={event.location ?? "TBA"} />
        <Detail label="Comments" value={String(event.commentsCount)} />
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-slate-950">Participants</h2>
        <p className="text-sm text-slate-600">
          {event.participantCount}
          {event.capacity === null
            ? " joined"
            : ` joined, ${event.attendeeCount} of ${event.capacity} spots used`}
        </p>
        <ParticipantList participants={event.participants} />
      </section>
    </article>
  );
}

function ParticipantList({
  participants,
}: {
  participants: DashboardEvent["participants"];
}) {
  if (participants.length === 0) {
    return <p className="text-sm text-slate-500">No participants yet.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {participants.map((participant) => (
        <li
          key={participant.id}
          className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-800"
        >
          {participant.name}
          {participant.extraSlots > 0 ? ` +${participant.extraSlots}` : ""}
        </li>
      ))}
    </ul>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className="rounded-md bg-slate-50 px-3 py-2">
      <span className="font-semibold text-slate-900">{label}:</span> {value}
    </p>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>
      {children}
    </span>
  );
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
