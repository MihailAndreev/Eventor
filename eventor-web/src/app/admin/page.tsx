import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAccessDenied, AdminShell } from "./_components";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminDashboardStats } from "@/services/admin";

export const metadata = {
  title: "Admin | Eventor",
};

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/admin");
  }

  if (currentUser.role !== "admin") {
    return <AdminAccessDenied />;
  }

  const stats = await getAdminDashboardStats(currentUser.id);
  const cards = [
    ["Users", stats.totalUsers, "/admin/users"],
    ["Groups", stats.totalGroups, "/admin/groups"],
    ["Events", stats.totalEvents, "/admin/events"],
    ["Comments", stats.totalComments, "/admin/comments"],
    ["Event links", stats.totalEventLinks, "/admin/events"],
    ["Active invites", stats.activeInvites, "/admin/groups"],
    ["Pending invites", stats.pendingInvites, "/admin/groups"],
  ] as const;

  return (
    <AdminShell
      title="Overview"
      description="Operational visibility across Eventor users, groups, events, comments, and links."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, href]) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#7FB3C4] hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
