"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createGroupInviteAction } from "@/app/groups/actions";
import { initialGroupInviteActionState } from "@/app/groups/types";

export function GroupInvitePanel({ groupId }: { groupId: number }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [state, formAction] = useActionState(
    createGroupInviteAction.bind(null, groupId),
    initialGroupInviteActionState,
  );
  const inviteUrl =
    typeof window !== "undefined" && state.invitePath
      ? new URL(state.invitePath, window.location.origin).toString()
      : state.invitePath;

  async function copyInviteLink() {
    if (!inviteUrl) {
      return;
    }

    try {
      await copyTextToClipboard(inviteUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }

    window.setTimeout(() => setCopyStatus("idle"), 1800);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">Invitations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create a one-use invite link for someone joining this group.
        </p>
      </div>

      <form action={formAction}>
        <SubmitButton />
      </form>

      {state.message ? (
        <p
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            state.ok
              ? "bg-[#EAF5F8] text-[#004F6E]"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {inviteUrl ? (
        <div className="mt-4 grid gap-2">
          <label
            htmlFor="group-invite-link"
            className="text-sm font-medium text-slate-800"
          >
            Invite link
          </label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              id="group-invite-link"
              readOnly
              value={inviteUrl}
              className="h-11 min-w-0 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 outline-none"
            />
            <button
              type="button"
              onClick={() => void copyInviteLink()}
              className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
            >
              {copyStatus === "copied"
                ? "Copied"
                : copyStatus === "failed"
                  ? "Copy failed"
                  : "Copy"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");

  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Copy command failed.");
    }
  } finally {
    textArea.remove();
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
    >
      {pending ? "Creating..." : "Create Invite Link"}
    </button>
  );
}
