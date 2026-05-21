"use client";

import type React from "react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createEventAction,
  updateEventAction,
} from "@/app/groups/[id]/events/actions";
import { initialEventManagementActionState } from "@/app/groups/[id]/events/types";
import type { EventManagementDetails } from "@/services/events";

type EventFormProps = {
  mode: "create" | "edit";
  groupId: number;
  event?: EventManagementDetails;
};

export function EventForm({ mode, groupId, event }: EventFormProps) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const action =
    mode === "edit" && event
      ? updateEventAction.bind(null, groupId, event.id)
      : createEventAction.bind(null, groupId);
  const [state, formAction] = useActionState(
    action,
    initialEventManagementActionState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <label className="grid gap-2 text-sm font-semibold text-slate-900">
        Title
        <input
          name="title"
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          maxLength={180}
          required
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
        />
      </label>
      <p className="-mt-3 text-xs text-slate-500">{title.trim().length}/180</p>

      <label className="grid gap-2 text-sm font-semibold text-slate-900">
        Description
        <textarea
          name="description"
          value={description}
          onChange={(changeEvent) => setDescription(changeEvent.target.value)}
          maxLength={2000}
          rows={5}
          className="min-h-32 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-6 text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
        />
      </label>
      <p className="-mt-3 text-xs text-slate-500">
        {description.trim().length}/2000
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-900">
          Date
          <input
            type="date"
            name="eventDate"
            defaultValue={event?.eventDate ?? ""}
            required
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-900">
          Time
          <input
            type="time"
            name="eventTime"
            defaultValue={formatTimeInput(event?.eventTime)}
            required
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-900">
          Location
          <input
            name="location"
            value={location}
            onChange={(changeEvent) => setLocation(changeEvent.target.value)}
            maxLength={240}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-900">
          Capacity
          <input
            type="number"
            name="capacity"
            min="1"
            step="1"
            defaultValue={event?.capacity ?? ""}
            placeholder="Unlimited"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
          />
        </label>
      </div>
      <p className="-mt-3 text-xs text-slate-500">{location.trim().length}/240</p>

      {mode === "edit" ? (
        <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900">
          <input
            type="checkbox"
            name="canceled"
            defaultChecked={event?.canceled ?? false}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#004F6E]"
          />
          <span>
            Canceled
            <span className="block text-xs font-normal leading-5 text-slate-500">
              Canceled events remain visible but are closed for participation changes.
            </span>
          </span>
        </label>
      ) : null}

      {state.message ? (
        <p
          role="status"
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok ? "bg-[#EAF5F8] text-[#004F6E]" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <SubmitButton>
          {mode === "create" ? "Create event" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}

function formatTimeInput(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}
