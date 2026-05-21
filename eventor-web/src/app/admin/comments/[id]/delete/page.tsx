import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminAccessDenied, formatDate } from "../../../_components";
import { deleteCommentAction } from "../../../actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminCommentDeleteDetails } from "@/services/admin";

export const metadata = {
  title: "Delete Comment | Eventor Admin",
};

export default async function DeleteAdminCommentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const commentId = Number(id);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?from=/admin/comments/${id}/delete`);
  }

  if (currentUser.role !== "admin") {
    return <AdminAccessDenied />;
  }

  if (!Number.isInteger(commentId)) {
    notFound();
  }

  const comment = await getAdminCommentDeleteDetails(currentUser.id, commentId);

  if (!comment) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin/comments"
        className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Back to comments
      </Link>
      <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
          Delete Comment
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Confirm comment deletion
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-800">
          This will permanently delete only this comment. The event, group, and
          author account will remain.
        </p>
        <dl className="mt-5 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
          <div>
            <dt className="font-semibold text-slate-500">Author</dt>
            <dd className="mt-1 text-slate-950">
              {comment.authorName} · {comment.authorEmail}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Event</dt>
            <dd className="mt-1 text-slate-950">{comment.eventTitle}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Group</dt>
            <dd className="mt-1 text-slate-950">{comment.groupTitle}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Created</dt>
            <dd className="mt-1 text-slate-950">{formatDate(comment.createdAt)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Excerpt</dt>
            <dd className="mt-1 break-words text-slate-950">
              {getExcerpt(comment.text)}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action={deleteCommentAction}>
            <input type="hidden" name="commentId" value={comment.id} />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Confirm Delete
            </button>
          </form>
          <Link
            href="/admin/comments"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
          >
            Cancel
          </Link>
        </div>
      </section>
    </div>
  );
}

function getExcerpt(value: string) {
  return value.length > 240 ? `${value.slice(0, 237)}...` : value;
}
