"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  joinEvent,
  leaveEvent,
  updateEventExtraSlots,
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

function revalidateEventPaths(eventId: number) {
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
}
