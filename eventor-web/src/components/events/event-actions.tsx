"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  joinEventAction,
  leaveEventAction,
  updateExtraSlotsAction,
} from "@/app/events/[id]/actions";
import { initialEventActionState } from "@/app/events/[id]/types";

type EventActionsProps = {
  eventId: number;
  isJoined: boolean;
  isActive: boolean;
  extraSlots: number;
  sharePath: string;
};

export function EventActions({
  eventId,
  isJoined,
  isActive,
  extraSlots,
  sharePath,
}: EventActionsProps) {
  const [copied, setCopied] = useState(false);
  const [slotValue, setSlotValue] = useState(extraSlots);
  const [joinState, joinAction] = useActionState(
    joinEventAction.bind(null, eventId),
    initialEventActionState,
  );
  const [leaveState, leaveAction] = useActionState(
    leaveEventAction.bind(null, eventId),
    initialEventActionState,
  );
  const [slotState, slotAction] = useActionState(
    updateExtraSlotsAction.bind(null, eventId),
    initialEventActionState,
  );
  const latestState = [slotState, leaveState, joinState].find(
    (state) => state?.message?.length > 0,
  );

  async function copyEventLink() {
    const url = new URL(sharePath, window.location.origin).toString();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Participation</h2>
          <p className="mt-1 text-sm text-slate-600">
            {isActive
              ? "This event is open for participation changes."
              : "This event is not open for participation changes."}
          </p>
        </div>
        <button
          type="button"
          onClick={copyEventLink}
          className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
        >
          {copied ? "Copied" : "Share event link"}
        </button>
      </div>

      <div className="grid gap-3">
        {isJoined ? (
          <form action={leaveAction}>
            <SubmitButton disabled={!isActive} variant="secondary">
              Leave event
            </SubmitButton>
          </form>
        ) : (
          <form action={joinAction}>
            <SubmitButton disabled={!isActive}>Join event</SubmitButton>
          </form>
        )}

        {isJoined ? (
          <form
            action={slotAction}
            className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Additional friends or family
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Reserve seats for people coming with you.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => setSlotValue((value) => Math.max(0, value - 1))}
                className="h-11 w-11 rounded-md border border-slate-300 bg-white text-lg font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                aria-label="Remove one additional guest"
                disabled={!isActive}
              >
                -
              </button>
              <label className="grid gap-1 text-sm font-medium text-slate-800">
                Guests
                <input
                  type="number"
                  name="extraSlots"
                  min="0"
                  max="20"
                  value={slotValue}
                  onChange={(event) => setSlotValue(Number(event.target.value))}
                  disabled={!isActive}
                  className="h-11 w-24 rounded-md border border-slate-300 bg-white px-3 text-center text-base font-semibold text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF] disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>
              <button
                type="button"
                onClick={() => setSlotValue((value) => Math.min(20, value + 1))}
                className="h-11 w-11 rounded-md border border-slate-300 bg-white text-lg font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                aria-label="Add one additional guest"
                disabled={!isActive}
              >
                +
              </button>
            </div>
            <SubmitButton disabled={!isActive}>Update participants</SubmitButton>
          </form>
        ) : null}
      </div>

      {latestState ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            latestState.ok
              ? "bg-[#EAF5F8] text-[#004F6E]"
              : "bg-red-50 text-red-700"
          }`}
        >
          {latestState.message}
        </p>
      ) : null}
    </section>
  );
}

function SubmitButton({
  children,
  disabled = false,
  variant = "primary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  const className =
    variant === "secondary"
      ? "h-11 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      : "h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500";

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={className}
    >
      {pending ? "Saving..." : children}
    </button>
  );
}
