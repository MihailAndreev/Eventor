import Link from "next/link";
import { EventActions } from "@/components/events/event-actions";
import {
  DashboardEvent,
  getCapacityLabel,
} from "@/services/events";

type EventCardProps = {
  event: DashboardEvent;
  muted?: boolean;
};

type BadgeTone = "blue" | "green" | "gray" | "red" | "orange" | "purple";

const badgeToneClasses: Record<BadgeTone, string> = {
  blue: "bg-sky-50 text-sky-800 ring-sky-200",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  red: "bg-red-50 text-red-800 ring-red-200",
  orange: "bg-amber-50 text-amber-800 ring-amber-200",
  purple: "bg-violet-50 text-violet-800 ring-violet-200",
};

export function EventCard({ event, muted = false }: EventCardProps) {
  return (
    <article
      className={`group rounded-lg border border-slate-200 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:p-5 ${
        muted ? "bg-slate-50/80" : "bg-white"
      }`}
    >
      <div className="grid gap-4">
        <EventHeader event={event} variant="card" />
        <EventMetaRow event={event} />

        <div className="grid gap-3 rounded-md bg-slate-50 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CapacitySummary event={event} />
            <p className="text-sm text-slate-600">
              {event.commentsCount} {event.commentsCount === 1 ? "comment" : "comments"}
            </p>
          </div>
          <CapacityProgressBar event={event} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ParticipantChips participants={event.participants} maxVisible={4} />
          <Link
            href={`/events/${event.id}`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          >
            View event
          </Link>
        </div>
      </div>
    </article>
  );
}

export function EventDetails({ event }: { event: DashboardEvent }) {
  return (
    <div className="grid gap-6">
      <EventHeader event={event} variant="detail" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-950">
                Event details
              </h2>
              <p className="text-sm text-slate-500">
                {event.commentsCount} {event.commentsCount === 1 ? "comment" : "comments"}
              </p>
            </div>
            <EventMetaRow event={event} variant="detail" />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-slate-950">
                Participants
              </h2>
              <p className="text-sm text-slate-600">
                {getParticipantSummary(event)}
              </p>
            </div>
            <ParticipantChips participants={event.participants} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-slate-950">
                Comments
              </h2>
              <p className="text-sm text-slate-600">
                Latest activity for this event.
              </p>
            </div>
            <CommentFeed event={event} />
          </section>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Capacity
              </h2>
              <CapacitySummary event={event} />
            </div>
            <CapacityProgressBar event={event} />
          </section>

          <EventActions
            eventId={event.id}
            isJoined={event.currentUserParticipation.joined}
            isActive={event.isActive}
            extraSlots={event.currentUserParticipation.extraSlots}
            sharePath={`/events/${event.id}`}
          />
        </aside>
      </div>
    </div>
  );
}

export function EventHeader({
  event,
  variant = "card",
}: {
  event: DashboardEvent;
  variant?: "card" | "detail";
}) {
  const isDetail = variant === "detail";

  return (
    <header
      className={
        isDetail
          ? "rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          : "grid gap-3"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-700">
            {event.groupTitle}
          </p>
          {isDetail ? (
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {event.title}
            </h1>
          ) : (
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              {event.title}
            </h3>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <EventStatusBadge event={event} />
          <CapacityBadge event={event} />
        </div>
      </div>

      {isDetail && event.description ? (
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          {event.description}
        </p>
      ) : null}
    </header>
  );
}

export function EventStatusBadge({ event }: { event: DashboardEvent }) {
  return (
    <>
      <Badge tone={getStatusTone(event)}>{event.timeState}</Badge>
      {event.canceled ? <Badge tone="red">canceled</Badge> : null}
    </>
  );
}

export function CapacityBadge({ event }: { event: DashboardEvent }) {
  return <Badge tone={getCapacityTone(event)}>{getCapacityLabel(event)}</Badge>;
}

export function CapacityProgressBar({ event }: { event: DashboardEvent }) {
  if (event.capacity === null) {
    return (
      <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800">
        Unlimited capacity
      </div>
    );
  }

  const percent =
    event.capacity > 0
      ? Math.min(100, Math.round((event.attendeeCount / event.capacity) * 100))
      : 100;

  return (
    <div className="grid gap-2">
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${getCapacityBarColor(event)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs font-medium text-slate-500">
        {percent}% of capacity reserved
      </p>
    </div>
  );
}

export function EventMetaRow({
  event,
  variant = "card",
}: {
  event: DashboardEvent;
  variant?: "card" | "detail";
}) {
  const items = [
    { label: "Date", value: formatDate(event.startAt) },
    { label: "Time", value: formatTime(event.startAt) },
    { label: "Location", value: event.location ?? "TBA" },
  ];

  if (variant === "detail") {
    items.push(
      { label: "Group", value: event.groupTitle },
      { label: "State", value: getStateLabel(event) },
      { label: "Capacity", value: getCapacityDetail(event) },
    );
  }

  return (
    <dl className="grid gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md border border-slate-200 bg-white px-3 py-2"
        >
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {item.label}
          </dt>
          <dd
            className={`mt-1 text-sm font-semibold text-slate-900 ${
              variant === "card" ? "truncate" : "break-words"
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ParticipantChips({
  participants,
  maxVisible,
}: {
  participants: DashboardEvent["participants"];
  maxVisible?: number;
}) {
  if (participants.length === 0) {
    return <p className="text-sm text-slate-500">No participants yet.</p>;
  }

  const visibleParticipants =
    maxVisible === undefined ? participants : participants.slice(0, maxVisible);
  const remainingCount =
    maxVisible === undefined ? 0 : Math.max(0, participants.length - maxVisible);

  return (
    <ul className="flex flex-wrap gap-2">
      {visibleParticipants.map((participant) => (
        <li
          key={participant.id}
          className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 ring-1 ring-slate-200"
        >
          <span className="truncate">{participant.name}</span>
          {participant.extraSlots > 0 ? (
            <span className="ml-1 text-slate-500">+{participant.extraSlots}</span>
          ) : null}
        </li>
      ))}
      {remainingCount > 0 ? (
        <li className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
          +{remainingCount} more
        </li>
      ) : null}
    </ul>
  );
}

function CapacitySummary({ event }: { event: DashboardEvent }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-950">
        {getCapacityDetail(event)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {getParticipantSummary(event)}
      </p>
    </div>
  );
}

function CommentFeed({ event }: { event: DashboardEvent }) {
  if (event.comments.length === 0) {
    return <p className="text-sm text-slate-500">No comments yet.</p>;
  }

  return (
    <ol className="relative grid gap-4 border-l border-slate-200 pl-4">
      {event.comments.map((comment) => (
        <li key={comment.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-950">
                {comment.authorName}
              </p>
              <time className="text-xs text-slate-500">
                {formatDateTime(comment.createdAt)}
              </time>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {comment.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: BadgeTone;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeToneClasses[tone]}`}
    >
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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getStatusTone(event: DashboardEvent): BadgeTone {
  if (event.timeState === "upcoming") {
    return "blue";
  }

  if (event.timeState === "current") {
    return "green";
  }

  return "gray";
}

function getCapacityTone(event: DashboardEvent): BadgeTone {
  if (event.capacityState === "unlimited") {
    return "purple";
  }

  if (event.capacityState === "under_capacity") {
    return "green";
  }

  if (event.capacityState === "full_capacity") {
    return "orange";
  }

  return "red";
}

function getCapacityBarColor(event: DashboardEvent) {
  if (event.capacityState === "over_capacity") {
    return "bg-red-500";
  }

  if (event.capacityState === "full_capacity") {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}

function getStateLabel(event: DashboardEvent) {
  return event.canceled ? `${event.timeState}, canceled` : event.timeState;
}

function getCapacityDetail(event: DashboardEvent) {
  const label = getCapacityLabel(event);

  if (event.capacity === null) {
    return label;
  }

  return `${label}, ${event.attendeeCount} of ${event.capacity} spots used`;
}

function getParticipantSummary(event: DashboardEvent) {
  if (event.capacity === null) {
    return `${event.participantCount} joined`;
  }

  return `${event.participantCount} joined, ${event.attendeeCount} of ${event.capacity} spots used`;
}
