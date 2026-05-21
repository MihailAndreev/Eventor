import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserManagedGroups } from "@/services/groups";

export default async function Home() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const managedGroups = await getUserManagedGroups(currentUser.id);
    const actions = [
      {
        href: "/dashboard",
        label: "Go to Dashboard",
        description: "Review upcoming and current events from your groups.",
        primary: true,
      },
      {
        href: "/groups",
        label: "View Groups",
        description: "Open the communities you plan and attend with.",
      },
      {
        href: "/groups/new",
        label: "Create Group",
        description: "Start a new space for recurring plans.",
      },
    ];

    return (
      <section className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-6 px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
            Home
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Welcome back, {currentUser.name}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Pick up where you left off: check your event dashboard, browse your
            groups, or create a new group for the people you plan with.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`grid min-h-36 content-between rounded-lg border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                action.primary
                  ? "border-[#B8D7E2] bg-[#EAF5F8] hover:border-[#7FB3C4]"
                  : "border-slate-200 bg-white hover:border-[#7FB3C4]"
              }`}
            >
              <span>
                <span
                  className={`text-base font-semibold ${
                    action.primary ? "text-[#004F6E]" : "text-slate-950"
                  }`}
                >
                  {action.label}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  {action.description}
                </span>
              </span>
              <span className="mt-5 text-sm font-semibold text-[#004F6E]">
                Open
              </span>
            </Link>
          ))}
          <details className="group grid min-h-36 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition open:sm:col-span-2 hover:-translate-y-0.5 hover:border-[#7FB3C4] hover:shadow-md">
            <summary className="grid h-full cursor-pointer list-none content-between [&::-webkit-details-marker]:hidden">
              <span>
                <span className="text-base font-semibold text-slate-950">
                  Create Event
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  Events are created inside a group you manage.
                </span>
              </span>
              <span className="mt-5 text-sm font-semibold text-[#004F6E]">
                Choose group
              </span>
            </summary>
            <div className="mt-5 border-t border-slate-200 pt-4">
              {managedGroups.length > 0 ? (
                <div className="grid gap-2">
                  <p className="text-sm font-medium text-slate-700">
                    Select a group to open its event tools.
                  </p>
                  <div className="grid gap-2">
                    {managedGroups.map((group) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="inline-flex min-h-10 items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
                      >
                        <span className="min-w-0 truncate">{group.title}</span>
                        <span className="ml-3 shrink-0 text-[#004F6E]">Open</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <p className="text-sm leading-6 text-slate-600">
                    Create or manage a group before adding events.
                  </p>
                  <Link
                    href="/groups/new"
                    className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Create Group
                  </Link>
                </div>
              )}
            </div>
          </details>
          {currentUser.role === "admin" ? (
            <Link
              href="/admin"
              className="grid min-h-36 content-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7FB3C4] hover:shadow-md"
            >
              <span>
                <span className="text-base font-semibold text-slate-950">
                  Admin Panel
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  Manage Eventor users, groups, events, and comments.
                </span>
              </span>
              <span className="mt-5 text-sm font-semibold text-[#004F6E]">
                Open
              </span>
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-16 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#004F6E]">
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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-md bg-slate-950 px-6 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-base font-semibold text-slate-950 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
            >
              Register
            </Link>
          </div>
        </div>
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
              Example app preview
            </p>
            <p className="mt-1 text-sm text-slate-600">
              A generic illustration of how shared plans can look in Eventor.
            </p>
          </div>
          <div className="rounded-md border border-[#D5E8EF] bg-[#EAF5F8] p-4">
            <p className="text-sm font-semibold text-[#004F6E]">
              Example group
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              Weekend plan
            </p>
            <p className="mt-3 text-sm text-slate-600">
              12 joined of 16 spots · Sample status
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Example group
              </p>
              <p className="mt-1 text-sm text-slate-600">Shared meetup</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Example group
              </p>
              <p className="mt-1 text-sm text-slate-600">Planning session</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
