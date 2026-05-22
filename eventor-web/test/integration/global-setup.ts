import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { AddressInfo } from "node:net";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { getIntegrationDb, resetAndSeedTestDb } from "./helpers/db";
import { configureIntegrationEnv } from "./helpers/env";

let server: Server | undefined;

export default async function setup() {
  configureIntegrationEnv();
  await migrate(getIntegrationDb(), { migrationsFolder: "./drizzle" });
  await resetAndSeedTestDb();

  const routes = {
    login: await import("@/app/api/auth/login/route"),
    register: await import("@/app/api/auth/register/route"),
    events: await import("@/app/api/events/route"),
    eventDetails: await import("@/app/api/events/[id]/route"),
    comments: await import("@/app/api/events/[id]/comments/route"),
    commentDetails: await import("@/app/api/events/[id]/comments/[commentId]/route"),
    join: await import("@/app/api/events/[id]/join/route"),
    leave: await import("@/app/api/events/[id]/leave/route"),
    slots: await import("@/app/api/events/[id]/slots/route"),
    session: await import("@/lib/auth/jwt"),
    users: await import("@/services/users"),
    admin: await import("@/services/admin"),
  };

  server = createServer(async (incoming, outgoing) => {
    try {
      const request = await toFetchRequest(incoming);
      const url = new URL(request.url);
      const method = request.method.toUpperCase();
      const eventMatch = /^\/api\/events\/([^/]+)$/.exec(url.pathname);
      const commentsMatch = /^\/api\/events\/([^/]+)\/comments$/.exec(url.pathname);
      const commentDetailsMatch = /^\/api\/events\/([^/]+)\/comments\/([^/]+)$/.exec(url.pathname);
      const eventActionMatch = /^\/api\/events\/([^/]+)\/(join|leave|slots)$/.exec(url.pathname);
      const adminDeleteMatch =
        /^\/admin\/(comments|groups|events)\/([^/]+)\/delete$/.exec(url.pathname);
      let apiResponse: Response;

      if (method === "GET" && adminDeleteMatch) {
        apiResponse = await getAdminDeletePageHarnessResponse(
          request,
          routes,
          adminDeleteMatch[1],
          adminDeleteMatch[2],
        );
      } else if (method === "GET" && url.pathname === "/admin") {
        apiResponse = await getAdminPageHarnessResponse(request, routes);
      } else if (method === "POST" && url.pathname === "/api/auth/login") {
        apiResponse = await routes.login.POST(request);
      } else if (method === "POST" && url.pathname === "/api/auth/register") {
        apiResponse = await routes.register.POST(request);
      } else if (method === "GET" && url.pathname === "/api/events") {
        apiResponse = await routes.events.GET(request);
      } else if (method === "GET" && eventMatch) {
        apiResponse = await routes.eventDetails.GET(request, {
          params: Promise.resolve({ id: eventMatch[1] }),
        });
      } else if (method === "POST" && commentsMatch) {
        apiResponse = await routes.comments.POST(request, {
          params: Promise.resolve({ id: commentsMatch[1] }),
        });
      } else if (method === "PATCH" && commentDetailsMatch) {
        apiResponse = await routes.commentDetails.PATCH(request, {
          params: Promise.resolve({
            id: commentDetailsMatch[1],
            commentId: commentDetailsMatch[2],
          }),
        });
      } else if (method === "DELETE" && commentDetailsMatch) {
        apiResponse = await routes.commentDetails.DELETE(request, {
          params: Promise.resolve({
            id: commentDetailsMatch[1],
            commentId: commentDetailsMatch[2],
          }),
        });
      } else if (method === "POST" && eventActionMatch?.[2] === "join") {
        apiResponse = await routes.join.POST(request, {
          params: Promise.resolve({ id: eventActionMatch[1] }),
        });
      } else if (method === "POST" && eventActionMatch?.[2] === "leave") {
        apiResponse = await routes.leave.POST(request, {
          params: Promise.resolve({ id: eventActionMatch[1] }),
        });
      } else if (method === "POST" && eventActionMatch?.[2] === "slots") {
        apiResponse = await routes.slots.POST(request, {
          params: Promise.resolve({ id: eventActionMatch[1] }),
        });
      } else {
        apiResponse = Response.json({ error: "Not found." }, { status: 404 });
      }

      await writeFetchResponse(outgoing, apiResponse);
    } catch (error) {
      outgoing.statusCode = 500;
      outgoing.setHeader("content-type", "application/json");
      outgoing.end(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error." }));
    }
  });

  await new Promise<void>((resolve) => {
    server?.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  process.env.INTEGRATION_BASE_URL = `http://127.0.0.1:${address.port}`;

  return async () => {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  };
}

async function getAdminPageHarnessResponse(
  request: Request,
  routes: {
    session: typeof import("@/lib/auth/jwt");
    users: typeof import("@/services/users");
    admin: typeof import("@/services/admin");
  },
) {
  const token = getCookieValue(request.headers.get("cookie"), "eventor_session");

  if (!token) {
    return new Response(null, {
      status: 307,
      headers: { location: "/login?from=/admin" },
    });
  }

  const session = await routes.session.verifySessionToken(token);
  const user = session ? await routes.users.getUserById(session.userId) : null;

  if (!user) {
    return new Response(null, {
      status: 307,
      headers: { location: "/login?from=/admin" },
    });
  }

  if (user.role !== "admin") {
    return new Response("<h1>Access denied</h1><p>Admin access is required.</p>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  }

  return new Response("<h1>Overview</h1><a>Users</a><a>Groups</a>", {
    status: 200,
    headers: { "content-type": "text/html" },
  });
}

async function getAdminDeletePageHarnessResponse(
  request: Request,
  routes: {
    session: typeof import("@/lib/auth/jwt");
    users: typeof import("@/services/users");
    admin: typeof import("@/services/admin");
  },
  section: string,
  id: string,
) {
  const user = await getUserFromCookie(request, routes);

  if (!user) {
    return new Response(null, {
      status: 307,
      headers: { location: `/login?from=/admin/${section}/${id}/delete` },
    });
  }

  if (user.role !== "admin") {
    return new Response("<h1>Access denied</h1><p>Admin access is required.</p>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  }

  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return new Response("Not found.", { status: 404 });
  }

  if (section === "comments") {
    const details = await routes.admin.getAdminCommentDeleteDetails(user.id, numericId);

    return details
      ? new Response(`<h1>Delete Comment</h1><p>${details.eventTitle}</p>`, {
          status: 200,
          headers: { "content-type": "text/html" },
        })
      : new Response("Not found.", { status: 404 });
  }

  if (section === "groups") {
    const details = await routes.admin.getAdminGroupDeleteDetails(user.id, numericId);

    return details
      ? new Response(`<h1>Delete Group</h1><p>${details.title}</p>`, {
          status: 200,
          headers: { "content-type": "text/html" },
        })
      : new Response("Not found.", { status: 404 });
  }

  const details = await routes.admin.getAdminEventDeleteDetails(user.id, numericId);

  return details
    ? new Response(`<h1>Delete Event</h1><p>${details.title}</p>`, {
        status: 200,
        headers: { "content-type": "text/html" },
      })
    : new Response("Not found.", { status: 404 });
}

async function getUserFromCookie(
  request: Request,
  routes: {
    session: typeof import("@/lib/auth/jwt");
    users: typeof import("@/services/users");
  },
) {
  const token = getCookieValue(request.headers.get("cookie"), "eventor_session");

  if (!token) {
    return null;
  }

  const session = await routes.session.verifySessionToken(token);

  return session ? routes.users.getUserById(session.userId) : null;
}

function getCookieValue(header: string | null, name: string) {
  const cookies = header?.split(";") ?? [];

  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.trim().split("=");

    if (cookieName === name) {
      return valueParts.join("=");
    }
  }

  return undefined;
}

async function toFetchRequest(incoming: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of incoming) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks);
  const headers = new Headers();

  for (const [key, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return new Request(`http://${incoming.headers.host}${incoming.url}`, {
    method: incoming.method,
    headers,
    body: body.length > 0 ? body : undefined,
  });
}

async function writeFetchResponse(
  outgoing: ServerResponse,
  apiResponse: Response,
) {
  outgoing.statusCode = apiResponse.status;

  apiResponse.headers.forEach((value, key) => {
    outgoing.setHeader(key, value);
  });

  outgoing.end(Buffer.from(await apiResponse.arrayBuffer()));
}
