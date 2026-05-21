import Link from "next/link";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  const redirectTo = safeRedirectPath(
    typeof params.from === "string" ? params.from : "/dashboard",
  );

  if (currentUser) {
    redirect(redirectTo);
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 sm:px-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Login
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Access your groups, events, comments, and notifications.
          </p>
        </div>
        <LoginForm redirectTo={redirectTo} />
        <p className="mt-6 text-center text-sm text-slate-600">
          New to Eventor?{" "}
          <Link href="/register" className="font-semibold text-[#004F6E]">
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}
