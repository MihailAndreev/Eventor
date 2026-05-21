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
import { getAdminCommentsPage } from "@/services/admin";

export const metadata = {
  title: "Admin Comments | Eventor",
};

export default async function AdminCommentsPage({
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
  const commentsPage = await getAdminCommentsPage(currentUser.id, {
    page: getPositiveIntegerParam(params.page, 1),
    pageSize: getPositiveIntegerParam(params.pageSize, 20),
    search: q,
  });

  return (
    <AdminShell
      title="Comments"
      description="Moderate event comments. Deletion is permanent and intentionally narrow."
    >
      <AdminSearch action="/admin/comments" defaultValue={q} placeholder="Search comments, authors, groups, or events" />
      <div className="grid gap-3">
        {commentsPage.items.map((comment) => (
          <article
            key={comment.id}
            className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">
                  <Link href={`/events/${comment.eventId}`} className="text-[#004F6E] hover:underline">
                    {comment.eventTitle}
                  </Link>
                  <span className="text-slate-400"> / </span>
                  <Link href={`/groups/${comment.groupId}`} className="hover:underline">
                    {comment.groupTitle}
                  </Link>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {comment.authorName} · {comment.authorEmail} · {formatDate(comment.createdAt)}
                </p>
              </div>
              <Link
                href={`/admin/comments/${comment.id}/delete`}
                className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
              >
                Delete
              </Link>
            </div>
            <p className="line-clamp-3 break-words text-sm leading-6 text-slate-700">
              {comment.text}
            </p>
          </article>
        ))}
      </div>
      <AdminPagination
        basePath="/admin/comments"
        page={commentsPage.page}
        pageSize={commentsPage.pageSize}
        total={commentsPage.total}
        totalPages={commentsPage.totalPages}
        query={{ q }}
      />
    </AdminShell>
  );
}
