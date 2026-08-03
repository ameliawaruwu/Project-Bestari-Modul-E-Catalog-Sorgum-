import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';
import { request, setToken, getToken } from './http';

const STORAGE_KEY = 'bestari_current_user';

// Backend shape: { message, data: { user, token } }
interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
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
  return { id: String(u.id), name: u.name, email: u.email, role: u.role };
}

export const authApi = {
  // Register user
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    try {
      const res = await request<{ message: string; data: { user: BackendUser; token: string } }>(
        '/auth/register',
        { method: 'POST', body: { name: payload.name, email: payload.email, password: payload.password } }
      );

      const user = mapUser(res.data.user);
      setToken(res.data.token);
      saveUser(user);

      return {
        success: true,
        message: res.message || 'Pendaftaran berhasil! Selamat bergabung dengan BESTARI.',
        user,
        token: res.data.token,
      };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Pendaftaran gagal. Silakan coba lagi.' };
    }
  },

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
        // token invalid/expired -> fall back to cache (UI can still render)
        return cached;
      }
    }

    return cached;
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
