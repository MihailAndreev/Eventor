import Link from "next/link";

export function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          <AdminNav />
        </div>
        {children}
      </section>
    </div>
  );
}

export function AdminAccessDenied() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-5 py-14 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
          Access denied
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          Admin access is required.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your account is signed in, but it does not have the admin role needed
          to view this area.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
        >
          Back to dashboard
        </Link>
      </section>
    </div>
  );
}

export function AdminNav() {
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/groups", label: "Groups" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/comments", label: "Comments" },
  ];

  return (
    <nav
      aria-label="Admin navigation"
      className="flex max-w-full gap-2 overflow-x-auto text-sm font-semibold"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:border-[#7FB3C4] hover:text-[#004F6E]"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminSearch({
  action,
  defaultValue,
  placeholder,
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
    >
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#0B6B8A] focus:ring-2 focus:ring-[#B8D7E2]"
      />
      <button
        type="submit"
        className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Search
      </button>
    </form>
  );
}

export function AdminPagination({
  basePath,
  page,
  pageSize,
  total,
  totalPages,
  query,
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
}) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Admin pagination"
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-slate-600">
        Page {page} of {totalPages}
        {total > 0 ? `, showing ${startItem}-${endItem} of ${total}` : ""}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          href={getPageHref(basePath, page - 1, pageSize, query)}
          disabled={page <= 1}
        >
          Previous
        </PaginationLink>
        <PaginationLink
          href={getPageHref(basePath, page + 1, pageSize, query)}
          disabled={page >= totalPages}
        >
          Next
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  children,
  disabled,
  href,
}: {
  children: React.ReactNode;
  disabled: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
    >
      {children}
    </Link>
  );
}

function getPageHref(
  basePath: string,
  page: number,
  pageSize: number,
  query?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) {
      params.set(key, value);
    }
  }

  return `${basePath}?${params.toString()}`;
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function getPositiveIntegerParam(
  value: string | string[] | undefined,
  fallback: number,
) {
  const parsed = Number(typeof value === "string" ? value : undefined);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
