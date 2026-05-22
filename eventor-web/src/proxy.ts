import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth/constants";
import { verifySessionToken } from "./lib/auth/jwt";

const publicPaths = new Set(["/", "/login", "/register"]);

const corsHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "DELETE, GET, PATCH, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        headers: corsHeaders,
        status: 204,
      });
    }

    const response = NextResponse.next();

    setCorsHeaders(response);

    return response;
  }

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
  loginUrl.searchParams.set("from", `${pathname}${search}`);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

function setCorsHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
}
