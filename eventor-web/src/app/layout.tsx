import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "./(auth)/actions";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eventor",
  description: "Plan, organize, and join group events with Eventor.",
  icons: {
    icon: "/eventor-icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-950">
        <header className="border-b border-slate-200 bg-white/95">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <Link href="/" className="shrink-0" aria-label="Eventor home">
                <Image
                  src="/eventor-logo.svg"
                  alt="Eventor"
                  width={180}
                  height={60}
                  priority
                  className="h-9 w-auto sm:h-10"
                />
              </Link>
              {currentUser ? (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="max-w-28 truncate rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 sm:max-w-none">
                    <span className="sm:hidden">{currentUser.name}</span>
                    <span className="hidden sm:inline">
                      {currentUser.name} · {currentUser.email}
                    </span>
                  </span>
                  <form action={logoutAction} className="shrink-0">
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-red-300 hover:text-red-700"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
            <nav
              aria-label="Main navigation"
              className="flex items-center gap-2 overflow-x-auto text-sm font-medium text-slate-700"
            >
              <Link
                href="/"
                className="whitespace-nowrap rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Home
              </Link>
              {currentUser ? (
                <Link
                  href="/dashboard"
                  className="whitespace-nowrap rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="whitespace-nowrap rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="whitespace-nowrap rounded-md bg-[#004F6E] px-3 py-2 text-white transition hover:bg-[#003F58]"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>&copy; 2026 Eventor. Built for groups that gather.</p>
            <p>Plan together. Show up together.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
