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
    // Guest session id — key TERPISAH dari `bestari_current_user` (cache user JSON).
    // Sebelumnya pakai key SAMA (bestari_current_user): saat login, saveUser() menimpa
    // session id guest dengan JSON user → session guest hilang → cart guest tidak
    // bisa di-merge/refresh dengan benar saat ganti user (bug sesi).
    const GUEST_KEY = 'bestari_guest_session';
    let sid = localStorage.getItem(GUEST_KEY);
    if (!sid) {
      sid = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_KEY, sid);
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

  // ─── Auto-retry untuk kegagalan KONEKSI (network error / timeout) ─────────
  // Latar belakang: di beberapa jaringan (ISP/proxy kantor, laptop teman),
  // koneksi ke server kadang putus sesaat ("Tidak dapat terhubung ke server"
  // muncul tiba-tiba padahal server sehat). Retry diam-diam 2x (800ms, 1600ms)
  // sebelum menyerah — di kondisi normal request langsung sukses, notif error
  // tidak pernah muncul. Retry HANYA untuk gagal di level koneksi (fetch throw /
  // abort timeout) — TIDAK untuk response HTTP error (4xx/5xx) supaya mutasi
  // (POST/PUT/DELETE) tidak dobel. Request mutasi tetap aman: kalau koneksi
  // gagal, request tidak sampai ke server (tidak ada side-effect ganda).
  const MAX_ATTEMPTS = 3; // 1x normal + 2x retry
  const RETRY_DELAYS = [800, 1600];

  let res: Response; // diisi di dalam loop; dipakai setelah loop (response handling)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
    }

    try {
      // Timeout 45s biar request tidak menggantung selamanya kalau BE lambat/hang.
      // 45s (bukan 20s) karena endpoint tracking/cek-resi bisa lambat (API ekspedisi
      // eksternal www.cekresi.com sering >20s). Timeout 20s bikin false-positive
      // "Tidak dapat terhubung ke server" padahal BE sehat cuma lambat.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      try {
        res = await fetch(`${API_BASE}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (e: any) {
      // Gagal di level koneksi (network error / timeout) — retry diam-diam.
      // Kalau sudah attempt terakhir, throw error yang jelas.
      if (attempt < MAX_ATTEMPTS - 1) {
        continue; // retry diam-diam (tanpa notif)
      }
      if (e?.name === 'AbortError') {
        throw new ApiError(0, 'Waktu permintaan habis. Server sibuk — coba lagi sebentar lagi.');
      }
      throw new ApiError(0, 'Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    }
  } // end for-loop (auto-retry)

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // empty body
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request gagal (${res.status})`;
    // 401 dari BE (bukan dari cek `auth && !token` di atas) = token invalid/expired.
    // Bersihkan sesi biar user tidak stuck di "login" palsu (currentUser set tapi
    // semua request auth gagal). Reload biar state React di-reset ke guest.
    if (res.status === 401 && auth) {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
      } catch { /* ignore */ }
    }
    // 403 = akses ditolak (biasanya sesi bukan admin / role tidak cukup). Pesan
    // default BE ("Akses ditolak. Hanya admin.") sudah jelas; kalau BE tidak
    // mengirim pesan, beri konteks yang actionable biar tester tidak bingung.
    if (res.status === 403 && !data?.error && !data?.message) {
      throw new ApiError(403, 'Akses ditolak. Pastikan Anda login sebagai admin.');
    }
    throw new ApiError(res.status, msg);
  }

  return data as T;
}
