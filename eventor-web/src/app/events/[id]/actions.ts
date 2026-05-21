"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  addEventComment,
  createEventLink,
  deleteEventComment,
  deleteEventLink,
  joinEvent,
  leaveEvent,
  removeEventCoverImage,
  updateEventComment,
  updateEventCoverImage,
  updateEventExtraSlots,
  updateEventLink,
} from "@/services/events";
import type { EventActionState } from "./types";

export async function joinEventAction(
  eventId: number,
  previousState: EventActionState,
): Promise<EventActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await joinEvent(currentUser.id, eventId);
  revalidateEventPaths(eventId);

  return result;
}

export async function leaveEventAction(
  eventId: number,
  previousState: EventActionState,
): Promise<EventActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await leaveEvent(currentUser.id, eventId);
  revalidateEventPaths(eventId);

  return result;
}

export async function updateExtraSlotsAction(
  eventId: number,
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const extraSlots = Number(formData.get("extraSlots") ?? 0);
  const result = await updateEventExtraSlots(currentUser.id, eventId, extraSlots);
  revalidateEventPaths(eventId);

  return result;
}

export async function addCommentAction(
  eventId: number,
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await addEventComment(
    currentUser.id,
    eventId,
    String(formData.get("text") ?? ""),
  );
  revalidateEventPaths(eventId);

  return result;
}

export async function updateEventCoverImageAction(
  eventId: number,
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const file = formData.get("coverImage");

  if (!(file instanceof File)) {
    return { ok: false, message: "Choose an image before saving." };
  }

  const result = await updateEventCoverImage(currentUser.id, eventId, file);
  revalidateEventPaths(eventId);

  return result;
}

export async function removeEventCoverImageAction(
  eventId: number,
  previousState: EventActionState,
): Promise<EventActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await removeEventCoverImage(currentUser.id, eventId);
  revalidateEventPaths(eventId);

  return result;
}

export async function addEventLinkAction(
  eventId: number,
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await createEventLink(currentUser.id, eventId, {
    title: String(formData.get("title") ?? ""),
    url: String(formData.get("url") ?? ""),
  });
  revalidateEventPaths(eventId);

  return result;
}

export async function editEventLinkAction(
  eventId: number,
  linkId: number,
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await updateEventLink(currentUser.id, eventId, linkId, {
    title: String(formData.get("title") ?? ""),
    url: String(formData.get("url") ?? ""),
  });
  revalidateEventPaths(eventId);

  return result;
}

export async function deleteEventLinkAction(
  eventId: number,
  linkId: number,
  previousState: EventActionState,
): Promise<EventActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await deleteEventLink(currentUser.id, eventId, linkId);
  revalidateEventPaths(eventId);

  return result;
}

export async function editCommentAction(
  eventId: number,
  commentId: number,
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await updateEventComment(
    currentUser.id,
    eventId,
    commentId,
    String(formData.get("text") ?? ""),
  );
  revalidateEventPaths(eventId);

  return result;
}

export async function deleteCommentAction(
  eventId: number,
  commentId: number,
  previousState: EventActionState,
): Promise<EventActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/events/${eventId}`);
  }

  const result = await deleteEventComment(currentUser.id, eventId, commentId);
  revalidateEventPaths(eventId);

  return result;
}

function revalidateEventPaths(eventId: number) {
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
}
