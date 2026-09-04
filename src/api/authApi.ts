import { AuthResponse, LoginPayload, User } from '../types';
import { request, setToken, getToken } from './http';

const STORAGE_KEY = 'bestari_current_user';

// Backend shape: { message, data: { user, token } }
interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  birth_date?: string | null;
  gender?: string | null;
}

function saveUser(user: User) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function mapUser(u: BackendUser): User {
  // Normalisasi birth_date (ISO "1995-05-19T17:00:00.000Z" → "1995-05-20" date input)
  // & gender ("laki-laki" → "Laki-laki") supaya form edit profil terisi benar.
  let birthDate: string | undefined;
  if (u.birth_date) {
    const iso = new Date(u.birth_date);
    if (!Number.isNaN(iso.getTime())) {
      const y = iso.getFullYear();
      const m = String(iso.getMonth() + 1).padStart(2, '0');
      const d = String(iso.getDate()).padStart(2, '0');
      birthDate = `${y}-${m}-${d}`;
    } else {
      birthDate = String(u.birth_date).slice(0, 10);
    }
  }
  let gender: string | undefined;
  if (u.gender) {
    const raw = String(u.gender).trim();
    // Kapitalisasi huruf pertama saja, sisanya dipertahankan — supaya
    // "laki-laki" → "Laki-laki" (match option select), bukan "Laki-Laki".
    gender = raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    birthDate,
    gender,
  };
}

export const authApi = {
  // Login user
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    try {
      const res = await request<{ message: string; data: { user: BackendUser; token: string } }>(
        '/auth/login',
        { method: 'POST', body: { email: payload.email, password: payload.password } }
      );

      const user = mapUser(res.data.user);
      setToken(res.data.token);
      saveUser(user);

      return {
        success: true,
        message: res.message || 'Berhasil masuk! Selamat datang kembali.',
        user,
        token: res.data.token,
      };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Email atau password salah.' };
    }
  },

  // Get current session (from backend /me when token present, else localStorage)
  getCurrentUser: async (): Promise<User | null> => {
    const cached = readUser();
    const token = getToken();

    if (token) {
      try {
        const res = await request<{ data: BackendUser }>('/auth/me');
        const fresh = mapUser(res.data);
        saveUser(fresh);
        return fresh;
      } catch {
        // Token invalid/expired — JANGAN fallback ke cache lama (bisa cache admin
        // yang nyangkut). Bersihin sesi biar user login ulang dengan bersih.
        try {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
        } catch {
          // ignore
        }
        return null;
      }
    }

    // Tidak ada token valid — cache localStorage tidak bisa dipercaya.
    // Bisa jadi cache admin lama yang nyangkut dari sesi sebelumnya.
    // Hapus cache basi, return null — user harus login ulang.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    return null;
  },

  // Logout
  logout: async (): Promise<boolean> => {
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return true;
  },
};
