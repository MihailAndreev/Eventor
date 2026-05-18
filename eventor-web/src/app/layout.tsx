import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-950">
        <header className="border-b border-slate-200 bg-white/95">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-slate-950"
            >
              Eventor
            </Link>
            <nav
              aria-label="Main navigation"
              className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700"
            >
              <Link
                href="/"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Home
              </Link>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-600 px-3 py-2 text-white transition hover:bg-emerald-700"
              >
                Register
              </Link>
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
