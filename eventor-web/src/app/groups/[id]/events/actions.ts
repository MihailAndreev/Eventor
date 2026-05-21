"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createManagedEvent,
  deleteManagedEvent,
  updateManagedEvent,
} from "@/services/events";
import type { EventManagementActionState } from "./types";

export async function createEventAction(
  groupId: number,
  _previousState: EventManagementActionState,
  formData: FormData,
): Promise<EventManagementActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/events/new`);
  }

  const result = await createManagedEvent(
    currentUser.id,
    groupId,
    getEventFormInput(formData),
  );

  if (!result.ok) {
    return result;
  }

  revalidateEventManagementPaths(groupId, result.eventId);
  redirect(`/events/${result.eventId}`);
}

export async function updateEventAction(
  groupId: number,
  eventId: number,
  _previousState: EventManagementActionState,
  formData: FormData,
): Promise<EventManagementActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/events/${eventId}/edit`);
  }

  const result = await updateManagedEvent(
    currentUser.id,
    groupId,
    eventId,
    getEventFormInput(formData),
  );

  if (!result.ok) {
    return result;
  }

  revalidateEventManagementPaths(groupId, eventId);
  redirect(`/events/${eventId}`);
}

export async function deleteEventAction(
  groupId: number,
  eventId: number,
  previousState: EventManagementActionState,
): Promise<EventManagementActionState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/groups/${groupId}/events/${eventId}/delete`);
  }

  const result = await deleteManagedEvent(currentUser.id, groupId, eventId);

  if (!result.ok) {
    return result;
  }

  revalidateEventManagementPaths(groupId, eventId);
  redirect(`/groups/${groupId}`);
}

function getEventFormInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    eventTime: String(formData.get("eventTime") ?? ""),
    location: String(formData.get("location") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
    canceled: formData.get("canceled") === "on",
  };
}

function revalidateEventManagementPaths(groupId: number, eventId?: number) {
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");

  if (eventId !== undefined) {
    revalidatePath(`/events/${eventId}`);
  }
}
