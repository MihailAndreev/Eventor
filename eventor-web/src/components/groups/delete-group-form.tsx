"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteGroupAction } from "@/app/groups/actions";
import { initialGroupActionState } from "@/app/groups/types";

export function DeleteGroupForm({ groupId }: { groupId: number }) {
  const [state, formAction] = useActionState(
    deleteGroupAction.bind(null, groupId),
    initialGroupActionState,
  );

  return (
    <form action={formAction} className="grid gap-3">
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
      <DeleteButton />
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-md bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
    >
      {pending ? "Deleting..." : "Confirm Delete"}
    </button>
  );
}
