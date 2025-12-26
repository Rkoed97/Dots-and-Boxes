export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
export const WS_PATH = process.env.NEXT_PUBLIC_WS_PATH ?? "/ws";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return res;
}
