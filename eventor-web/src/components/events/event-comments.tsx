"use client";

import type React from "react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addCommentAction,
  deleteCommentAction,
  editCommentAction,
} from "@/app/events/[id]/actions";
import { initialEventActionState } from "@/app/events/[id]/types";
import type { DashboardEvent } from "@/services/events";

type EventCommentsProps = {
  eventId: number;
  comments: DashboardEvent["comments"];
  currentUserId: number;
  canManageComments: boolean;
};

export function EventComments({
  eventId,
  comments,
  currentUserId,
  canManageComments,
}: EventCommentsProps) {
  const [addState, addAction] = useActionState(
    addCommentAction.bind(null, eventId),
    initialEventActionState,
  );
  const latestCommentKey = comments[0]
    ? `${comments[0].id}-${comments[0].createdAt.toISOString()}`
    : "no-comments";

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <NewCommentForm key={latestCommentKey} action={addAction} />
        <ActionMessage state={addState} />
      </div>

      {comments.length === 0 ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
          No comments yet.
        </p>
      ) : (
        <ol className="relative grid gap-4 border-l border-slate-200 pl-4">
          {comments.map((comment) => (
            <CommentItem
              key={`${comment.id}-${comment.updatedAt.toISOString()}`}
              eventId={eventId}
              comment={comment}
              canEdit={comment.userId === currentUserId}
              canDelete={comment.userId === currentUserId || canManageComments}
              isCurrentUserComment={comment.userId === currentUserId}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function NewCommentForm({ action }: { action: (formData: FormData) => void }) {
  const [text, setText] = useState("");

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-2 text-sm font-semibold text-slate-900">
        Add a comment
        <textarea
          name="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={1000}
          rows={4}
          className="min-h-28 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
          placeholder="Share an update, question, or useful detail."
        />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{text.trim().length}/1000</p>
        <SubmitButton>Add comment</SubmitButton>
      </div>
    </form>
  );
}

function CommentItem({
  eventId,
  comment,
  canEdit,
  canDelete,
  isCurrentUserComment,
}: {
  eventId: number;
  comment: DashboardEvent["comments"][number];
  canEdit: boolean;
  canDelete: boolean;
  isCurrentUserComment: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [editState, editAction] = useActionState(
    editCommentAction.bind(null, eventId, comment.id),
    initialEventActionState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteCommentAction.bind(null, eventId, comment.id),
    initialEventActionState,
  );
  const hasTextChanges = text.trim() !== comment.text.trim();

  return (
    <li className="relative">
      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#007EA0] ring-4 ring-white" />
      <div className="grid gap-3 rounded-md bg-slate-50 px-3 py-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {isCurrentUserComment
                ? `You (${comment.authorName})`
                : comment.authorName}
            </p>
            <time className="text-xs text-slate-500">
              {formatDateTime(comment.createdAt)}
              {comment.updatedAt.getTime() !== comment.createdAt.getTime()
                ? " (edited)"
                : ""}
            </time>
          </div>
          <div className="flex gap-2">
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setText(comment.text);
                  setIsEditing((value) => !value);
                }}
                className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            ) : null}
            {canDelete ? (
              <form action={deleteAction}>
                <DeleteButton />
              </form>
            ) : null}
          </div>
        </div>

        {isEditing ? (
          <form action={editAction} className="grid gap-2">
            <textarea
              name="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={1000}
              rows={3}
              className="min-h-24 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">{text.trim().length}/1000</p>
              <SubmitButton disabled={!hasTextChanges}>Save changes</SubmitButton>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {comment.text}
          </p>
        )}

        <ActionMessage state={editState} />
        <ActionMessage state={deleteState} />
      </div>
    </li>
  );
}

function SubmitButton({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

function ActionMessage({
  state,
}: {
  state: { ok: boolean; message: string };
}) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      role="status"
      className={`rounded-md px-3 py-2 text-sm ${
        state.ok ? "bg-[#EAF5F8] text-[#004F6E]" : "bg-red-50 text-red-700"
      }`}
    >
      {state.message}
    </p>
  );
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
