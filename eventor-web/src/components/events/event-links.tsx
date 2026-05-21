"use client";

import type React from "react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addEventLinkAction,
  deleteEventLinkAction,
  editEventLinkAction,
} from "@/app/events/[id]/actions";
import { initialEventActionState } from "@/app/events/[id]/types";
import type { EventLink } from "@/services/events";

export function EventLinks({
  eventId,
  links,
  canManage,
}: {
  eventId: number;
  links: EventLink[];
  canManage: boolean;
}) {
  const addAction = addEventLinkAction.bind(null, eventId);
  const [addState, addFormAction] = useActionState(addAction, initialEventActionState);

  return (
    <div className="grid gap-4">
      {links.length > 0 ? (
        <ul className="grid gap-3">
          {links.map((link) => (
            <EventLinkItem
              key={link.id}
              eventId={eventId}
              link={link}
              canManage={canManage}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No links added yet.</p>
      )}

      {canManage ? (
        <form action={addFormAction} className="grid gap-3 border-t border-slate-200 pt-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
            <input
              name="title"
              maxLength={180}
              placeholder="Title"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
              required
            />
            <input
              name="url"
              type="url"
              maxLength={2048}
              placeholder="https://example.com"
              className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
              required
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>Add link</SubmitButton>
            <StatusMessage state={addState} />
          </div>
        </form>
      ) : null}
    </div>
  );
}

function EventLinkItem({
  eventId,
  link,
  canManage,
}: {
  eventId: number;
  link: EventLink;
  canManage: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const editAction = editEventLinkAction.bind(null, eventId, link.id);
  const deleteAction = deleteEventLinkAction.bind(null, eventId, link.id);
  const [editState, editFormAction] = useActionState(editAction, initialEventActionState);
  const [deleteState, deleteFormAction] = useActionState(deleteAction, initialEventActionState);

  if (isEditing) {
    return (
      <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <form action={editFormAction} className="grid gap-3">
          <input
            name="title"
            defaultValue={link.title}
            maxLength={180}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
            required
          />
          <input
            name="url"
            type="url"
            defaultValue={link.url}
            maxLength={2048}
            className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
            required
          />
          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton>Save</SubmitButton>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
            >
              Cancel
            </button>
            <StatusMessage state={editState} />
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 transition hover:text-[#004F6E]"
        >
          <span className="block truncate text-sm font-semibold text-slate-950">
            {link.title}
          </span>
          <span className="block max-w-full truncate text-xs text-slate-500">
            {link.displayUrl}
          </span>
        </a>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open
          </a>
          {canManage ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
              >
                Edit
              </button>
              <form action={deleteFormAction}>
                <SubmitButton variant="danger">Delete</SubmitButton>
              </form>
            </>
          ) : null}
        </div>
      </div>
      <StatusMessage state={deleteState} />
    </li>
  );
}

function StatusMessage({ state }: { state: { ok: boolean; message: string } }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      role="status"
      className={`text-sm ${state.ok ? "text-[#004F6E]" : "text-red-700"}`}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();
  const classes =
    variant === "danger"
      ? "border border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 disabled:text-red-400"
      : "bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-500";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed ${classes}`}
    >
      {pending ? "Saving..." : children}
    </button>
  );
}
