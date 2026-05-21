import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { acceptGroupInvite } from "@/services/groups";

export default async function JoinGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;
  const groupId = Number(id);
  const inviteCode = typeof code === "string" ? code : "";

  if (!Number.isInteger(groupId)) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const invitePath = `/groups/${id}/join?code=${encodeURIComponent(inviteCode)}`;

  if (!currentUser) {
    redirect(`/login?from=${encodeURIComponent(invitePath)}`);
  }

  const result = await acceptGroupInvite(currentUser.id, groupId, inviteCode);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href="/groups"
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to groups
      </Link>

      <section
        className={`rounded-lg border p-6 shadow-sm ${
          result.ok
            ? "border-[#B8D7E2] bg-[#F4FAFC]"
            : "border-red-200 bg-red-50"
        }`}
      >
        <p
          className={`text-sm font-semibold uppercase tracking-[0.18em] ${
            result.ok ? "text-[#004F6E]" : "text-red-700"
          }`}
        >
          Group invitation
        </p>
        <h1
          className={`mt-2 text-3xl font-bold tracking-tight ${
            result.ok ? "text-slate-950" : "text-red-950"
          }`}
        >
          {result.ok ? getSuccessTitle(result.status) : "Invite unavailable"}
        </h1>
        <p
          className={`mt-3 text-base leading-7 ${
            result.ok ? "text-slate-700" : "text-red-800"
          }`}
        >
          {result.message}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {result.ok ? (
            <Link
              href={`/groups/${result.groupId}`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View group
            </Link>
          ) : null}
          <Link
            href="/groups"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
          >
            Go to my groups
          </Link>
        </div>
      </section>
    </div>
  );
}

function getSuccessTitle(status: "accepted" | "already_member") {
  switch (status) {
    case "accepted":
      return "You joined the group";
    case "already_member":
      return "You are already in this group";
  }
}
