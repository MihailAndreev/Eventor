import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AdminAccessDenied,
  AdminPagination,
  AdminSearch,
  AdminShell,
  formatDate,
  getPositiveIntegerParam,
  getStringParam,
} from "../_components";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminGroupsPage } from "@/services/admin";

export const metadata = {
  title: "Admin Groups | Eventor",
};

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    q?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?from=/admin");
  }

  if (currentUser.role !== "admin") {
    return <AdminAccessDenied />;
  }

  const q = getStringParam(params.q);
  const groupsPage = await getAdminGroupsPage(currentUser.id, {
    page: getPositiveIntegerParam(params.page, 1),
    pageSize: getPositiveIntegerParam(params.pageSize, 20),
    search: q,
  });

  return (
    <AdminShell
      title="Groups"
      description="Read-only group inventory with membership and event counts."
    >
      <AdminSearch action="/admin/groups" defaultValue={q} placeholder="Search group title" />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Managers</th>
              <th className="px-4 py-3">Events</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {groupsPage.items.map((group) => (
              <tr key={group.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{group.id}</td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/groups/${group.id}`} className="text-[#004F6E] hover:underline">
                    {group.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{group.memberCount}</td>
                <td className="px-4 py-3 text-slate-700">{group.managerCount}</td>
                <td className="px-4 py-3 text-slate-700">{group.eventCount}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(group.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/groups/${group.id}/delete`}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                  >
                    Delete
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination
        basePath="/admin/groups"
        page={groupsPage.page}
        pageSize={groupsPage.pageSize}
        total={groupsPage.total}
        totalPages={groupsPage.totalPages}
        query={{ q }}
      />
    </AdminShell>
  );
}
