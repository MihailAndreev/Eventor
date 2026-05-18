import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth/constants";
import { verifySessionToken } from "./lib/auth/jwt";

const publicPaths = new Set(["/", "/login", "/register"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySessionToken(token);

    if (session) {
      return NextResponse.next();
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
