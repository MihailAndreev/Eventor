"use client";

import { FormEvent, useState } from "react";

export function RegisterForm() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Registration will connect to the authentication service soon.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
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
      <button
        type="submit"
        className="h-12 rounded-md bg-emerald-600 px-5 text-base font-semibold text-white transition hover:bg-emerald-700"
      >
        Create account
      </button>
      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
    </form>
  );
}
