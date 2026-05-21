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
import { updateUserRoleAction } from "../actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminUsersPage } from "@/services/admin";

export const metadata = {
  title: "Admin Users | Eventor",
};

export default async function AdminUsersPage({
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
  const usersPage = await getAdminUsersPage(currentUser.id, {
    page: getPositiveIntegerParam(params.page, 1),
    pageSize: getPositiveIntegerParam(params.pageSize, 20),
    search: q,
  });

  return (
    <AdminShell
      title="Users"
      description="Review user accounts and safely adjust admin roles."
    >
      <AdminSearch action="/admin/users" defaultValue={q} placeholder="Search name or email" />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Managed</th>
              <th className="px-4 py-3">Change role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {usersPage.items.map((user) => (
              <tr key={user.id} className="align-top">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{user.id}</td>
                <td className="px-4 py-3 font-medium text-slate-950">{user.name}</td>
                <td className="px-4 py-3 text-slate-700">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3 text-slate-700">{user.groupsJoinedCount}</td>
                <td className="px-4 py-3 text-slate-700">{user.groupsManagedCount}</td>
                <td className="px-4 py-3">
                  <form action={updateUserRoleAction} className="flex gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="role"
                      value={user.role === "admin" ? "user" : "admin"}
                    />
                    <button
                      type="submit"
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
                    >
                      {user.role === "admin" ? "Make user" : "Make admin"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination
        basePath="/admin/users"
        page={usersPage.page}
        pageSize={usersPage.pageSize}
        total={usersPage.total}
        totalPages={usersPage.totalPages}
        query={{ q }}
      />
    </AdminShell>
  );
}
