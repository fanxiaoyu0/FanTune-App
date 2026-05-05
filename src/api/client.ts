const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3000';

let authCookie = '';

export function setAuth(token: string, userid: string) {
  authCookie = `token=${token};userid=${userid}`;
}

export function getAuthCookie() {
  return authCookie;
}

export function clearAuth() {
  authCookie = '';
}

export async function api<T = any>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    query.set(k, String(v));
  }
  if (authCookie) {
    query.set('cookie', authCookie);
  }

  const url = `${API_BASE}${path}?${query.toString()}`;
  const res = await fetch(url);
  const text = await res.text();
  const cleaned = text.replace(/<!--.*?-->/g, '');
  const data = JSON.parse(cleaned);

  if (data?.error_code === 20028 || data?.errcode === 20028) {
    notifyAuthExpired();
    throw new AuthError('Token expired');
  }

  return data;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

let onAuthExpired: (() => void) | null = null;
export function setOnAuthExpired(cb: () => void) {
  onAuthExpired = cb;
}
export function notifyAuthExpired() {
  onAuthExpired?.();
}
