// ---------------------------------------------------------------------------
// Shared HTTP helper for the SORGUM frontend.
// - Attaches Bearer token (from localStorage) & x-session-id (guest cart) headers
// - Throws ApiError with server message on non-2xx
// ---------------------------------------------------------------------------

export const API_BASE = '/api';

const TOKEN_KEY = 'bestari_session_id';
const SESSION_KEY = 'bestari_current_user';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  // Extra headers to merge with defaults (e.g. explicit owner headers snapshot)
  headers?: Record<string, string>;
  // For FormData uploads: pass raw FormData and skip JSON.stringify
  isFormData?: boolean;
  // Admin-only endpoints will check token presence
  auth?: boolean;
}

export async function request<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers: extraHeaders = {}, isFormData = false, auth = false } = opts;

  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Always send session id (harmless for logged-in users, required for guest cart)
  headers['x-session-id'] = getSessionId();

  // Explicit owner headers (snapshot from caller) override defaults
  Object.assign(headers, extraHeaders);

  if (auth && !token) {
    throw new ApiError(401, 'Anda harus login sebagai admin untuk melakukan aksi ini.');
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Tidak dapat terhubung ke server. Pastikan backend berjalan.');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // empty body
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request gagal (${res.status})`;
    throw new ApiError(res.status, msg);
  }

  return data as T;
}
