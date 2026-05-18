import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  const currentUser = await getCurrentUser();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-16 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Welcome to Eventor
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Bring every group plan into one clear place.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Eventor helps friends, colleagues, clubs, families, and communities
            create shared events, manage attendance, and keep everyone aligned
            before the day arrives.
          </p>
          {!currentUser && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md bg-slate-950 px-6 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-base font-semibold text-slate-950 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Hiking group
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              Saturday Ridge Walk
            </p>
            <p className="mt-3 text-sm text-slate-600">
              12 joined of 16 spots · Upcoming
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Book club
              </p>
              <p className="mt-1 text-sm text-slate-600">Thursday meetup</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Study circle
              </p>
              <p className="mt-1 text-sm text-slate-600">Exam prep session</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
