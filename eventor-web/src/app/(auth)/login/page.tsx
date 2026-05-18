import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
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
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-600">
          New to Eventor?{" "}
          <Link href="/register" className="font-semibold text-emerald-700">
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}
