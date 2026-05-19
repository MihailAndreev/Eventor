"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/(auth)/actions";
import { initialAuthActionState } from "@/app/(auth)/types";

export function LoginForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(
    loginAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
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
          className="h-12 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
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
          autoComplete="current-password"
          required
          className="h-12 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-[#004F6E] focus:ring-4 focus:ring-[#D5E8EF]"
          placeholder="Enter your password"
        />
      </div>
      <LoginSubmitButton />
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 rounded-md bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
    >
      {pending ? "Logging in..." : "Login"}
    </button>
  );
}
