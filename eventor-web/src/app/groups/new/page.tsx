import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupForm } from "@/components/groups/group-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "New Group | Eventor",
};

export default async function NewGroupPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/groups/new");
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href="/groups"
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to groups
      </Link>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#004F6E]">
            New Group
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Create a Community
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Start a permanent group for recurring events and shared plans.
          </p>
        </div>
        <GroupForm mode="create" />
      </section>
    </div>
  );
}
