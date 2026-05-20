export type LoginUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type LoginResponse = {
  token: string;
  tokenType: 'Bearer';
  user: LoginUser;
};

type ApiErrorResponse = {
  error?: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_BASE_URL.');
}

export async function loginRequest(input: { email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const body = (await response.json().catch(() => null)) as LoginResponse | ApiErrorResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Login failed. Please try again.');
  }

  if (!body || !('token' in body) || !('user' in body)) {
    throw new Error('Login response is invalid.');
  }

  return body;
}
