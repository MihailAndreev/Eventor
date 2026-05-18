"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/app/(auth)/actions";
import { initialAuthActionState } from "@/app/(auth)/types";

export function RegisterForm() {
  const [state, formAction] = useActionState(
    registerAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-800">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="h-12 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          placeholder="Jane Planner"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-800">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          placeholder="you@example.com"
        />
      </div>
      <div className="grid gap-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-800"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-12 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          placeholder="Create a password"
        />
      </div>
      <RegisterSubmitButton />
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function RegisterSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 rounded-md bg-emerald-600 px-5 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
    >
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}
