"use client";

import type React from "react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createGroupAction,
  updateGroupAction,
} from "@/app/groups/actions";
import { initialGroupActionState } from "@/app/groups/types";

type GroupFormProps = {
  mode: "create" | "edit";
  groupId?: number;
  initialTitle?: string;
  initialDescription?: string | null;
};

export function GroupForm({
  mode,
  groupId,
  initialTitle = "",
  initialDescription = "",
}: GroupFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const action =
    mode === "edit" && groupId !== undefined
      ? updateGroupAction.bind(null, groupId)
      : createGroupAction;
  const [state, formAction] = useActionState(action, initialGroupActionState);
  const titleLength = title.trim().length;
  const descriptionLength = description.trim().length;

  return (
    <form action={formAction} className="grid gap-5">
      <label className="grid gap-2 text-sm font-semibold text-slate-900">
        Title
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={180}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
          required
        />
      </label>
      <p className="-mt-3 text-xs text-slate-500">{titleLength}/180</p>

      <label className="grid gap-2 text-sm font-semibold text-slate-900">
        Description
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          rows={6}
          className="min-h-36 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-6 text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
        />
      </label>
      <p className="-mt-3 text-xs text-slate-500">{descriptionLength}/1000</p>

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
          {mode === "create" ? "Create group" : "Save changes"}
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
