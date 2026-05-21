export function getIntegrationBaseUrl() {
  const baseUrl = process.env.INTEGRATION_BASE_URL;

  if (!baseUrl) {
    throw new Error("INTEGRATION_BASE_URL was not configured.");
  }

  return baseUrl;
}

export async function apiFetch(
  path: string,
  init: RequestInit & { token?: string } = {},
) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (init.token) {
    headers.set("authorization", `Bearer ${init.token}`);
  }

  return fetch(new URL(path, getIntegrationBaseUrl()), {
    ...init,
    headers,
  });
}

export async function login(email: string, password: string) {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Login failed with ${response.status}: ${JSON.stringify(body)}`);
  }

  return body as {
    token: string;
    tokenType: "Bearer";
    user: { id: number; email: string; name: string; role: "user" | "admin" };
  };
}
