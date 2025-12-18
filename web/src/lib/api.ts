const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include", // IMPORTANT for cookies
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  // attempt to parse json error bodies
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export async function me() {
  return apiFetch("/api/auth/me", { method: "GET" });
}

export async function login(email: string, password: string) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}
