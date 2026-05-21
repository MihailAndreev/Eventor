"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { leaveGroupAction } from "@/app/groups/actions";
import { initialGroupActionState } from "@/app/groups/types";

export function LeaveGroupForm({
  groupId,
  disabled = false,
}: {
  groupId: number;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(
    leaveGroupAction.bind(null, groupId),
    initialGroupActionState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      {state.message ? (
        <p
          role="status"
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok
              ? "bg-[#EAF5F8] text-[#004F6E]"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <LeaveButton disabled={disabled} />
    </form>
  );
}

function LeaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-11 items-center justify-center rounded-md bg-amber-700 px-5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-300"
    >
      {pending ? "Leaving..." : "Confirm Leave"}
    </button>
  );
}
