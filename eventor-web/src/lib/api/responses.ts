import type { DashboardEvent } from "@/services/events";

export const corsHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

export function apiJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  });
}

export function apiError(message: string, status = 400) {
  return apiJson({ error: message }, { status });
}

export function apiOptions() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  });
}

export function invalidEventIdResponse() {
  return apiError("Event not found.", 404);
}

export function parseEventId(value: string) {
  const eventId = Number(value);

  return Number.isInteger(eventId) && eventId > 0 ? eventId : null;
}

export function serializeEventListItem(event: DashboardEvent) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.eventDate,
    time: event.eventTime,
    startAt: event.startAt.toISOString(),
    location: event.location,
    group: {
      id: event.groupId,
      title: event.groupTitle,
      slug: event.groupSlug,
    },
    state: event.timeState,
    capacity: event.capacity,
    unlimitedCapacity: event.capacity === null,
    capacityState: event.capacityState,
    isJoined: event.currentUserParticipation.joined,
    participantsJoined: event.participantCount,
    reservedSlots: getReservedSlots(event),
    attendeeCount: event.attendeeCount,
    isJoinable: event.isActive && event.capacityState !== "full_capacity",
  };
}

export function serializeEventDetails(event: DashboardEvent) {
  return {
    ...serializeEventListItem(event),
    commentsCount: event.commentsCount,
    currentUserReservedSlots: event.currentUserParticipation.extraSlots,
    participants: event.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      extraSlots: participant.extraSlots,
    })),
    comments: event.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      authorName: comment.authorName,
    })),
  };
}

function getReservedSlots(event: DashboardEvent) {
  return Math.max(0, event.attendeeCount - event.participantCount);
}
