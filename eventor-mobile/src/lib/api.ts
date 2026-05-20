import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type LoginUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type LoginResponse = {
  token: string;
  tokenType: 'Bearer';
  user: LoginUser;
};

type ApiErrorResponse = {
  error?: string;
};

export type EventListItem = {
  id: number;
  title: string;
  description: string | null;
  date: string;
  time: string;
  startAt: string;
  location: string | null;
  group: {
    id: number;
    title: string;
    slug: string;
  };
  state: 'upcoming' | 'current' | 'past' | 'cancelled' | string;
  capacity: number | null;
  unlimitedCapacity: boolean;
  capacityState: string;
  isJoined: boolean;
  participantsJoined: number;
  reservedSlots: number;
  attendeeCount: number;
  isJoinable: boolean;
};

export type EventsPage = {
  data: EventListItem[];
  paging: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type EventDetails = EventListItem & {
  commentsCount: number;
  currentUserReservedSlots: number;
  participants: {
    id: number;
    name: string;
    extraSlots: number;
  }[];
  comments: {
    id: number;
    text: string;
    createdAt: string;
    authorName: string;
  }[];
};

type EventDetailsResponse = {
  data: EventDetails;
};

type EventMutationResponse = {
  ok: boolean;
  message: string;
};

const API_BASE_URL = getApiBaseUrl();

if (!API_BASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_BASE_URL.');
}

export async function loginRequest(input: { email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const body = (await response.json().catch(() => null)) as LoginResponse | ApiErrorResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Login failed. Please try again.');
  }

  if (!body || !('token' in body) || !('user' in body)) {
    throw new Error('Login response is invalid.');
  }

  return body;
}

export async function getActiveEventsPage(input: {
  page: number;
  pageSize: number;
  token: string;
}) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });
  const response = await fetch(`${API_BASE_URL}/events?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  });
  const body = (await response.json().catch(() => null)) as EventsPage | ApiErrorResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Unable to load events.');
  }

  if (!body || !('data' in body) || !('paging' in body)) {
    throw new Error('Events response is invalid.');
  }

  return body;
}

export async function getEventDetails(input: { id: string; token: string }) {
  const response = await fetch(`${API_BASE_URL}/events/${input.id}`, {
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  });
  const body = (await response.json().catch(() => null)) as EventDetailsResponse | ApiErrorResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Unable to load event details.');
  }

  if (!body || !('data' in body)) {
    throw new Error('Event details response is invalid.');
  }

  return body.data;
}

export async function joinEventRequest(input: { id: number; token: string }) {
  return eventMutation(`/events/${input.id}/join`, input.token);
}

export async function leaveEventRequest(input: { id: number; token: string }) {
  return eventMutation(`/events/${input.id}/leave`, input.token);
}

export async function updateEventSlotsRequest(input: {
  id: number;
  extraSlots: number;
  token: string;
}) {
  return eventMutation(`/events/${input.id}/slots`, input.token, {
    extraSlots: input.extraSlots,
  });
}

async function eventMutation(path: string, token: string, body?: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = (await response.json().catch(() => null)) as EventMutationResponse | ApiErrorResponse | null;

  if (!response.ok || !result || !('ok' in result)) {
    throw new Error(result?.error ?? 'Unable to update event.');
  }

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!configuredUrl || Platform.OS === 'web') {
    return configuredUrl;
  }

  try {
    const url = new URL(configuredUrl);

    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      return configuredUrl;
    }

    const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];

    if (!metroHost) {
      return configuredUrl;
    }

    url.hostname = metroHost;

    return url.toString().replace(/\/$/, '');
  } catch {
    return configuredUrl;
  }
}
