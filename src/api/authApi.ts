import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';

const STORAGE_KEY = 'bestari_current_user';

export const authApi = {
  // Register user service placeholder
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (!payload.email || !payload.password || !payload.name) {
      return {
        success: false,
        message: 'Mohon lengkapi seluruh data pendaftaran.',
      };
    }

    if (payload.password.length < 6) {
      return {
        success: false,
        message: 'Kata sandi minimal harus 6 karakter.',
      };
    }

    if (payload.confirmPassword && payload.password !== payload.confirmPassword) {
      return {
        success: false,
        message: 'Konfirmasi kata sandi tidak cocok.',
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {
      // ignore quota or iframe localStorage limits
    }

    return {
      success: true,
      message: 'Pendaftaran berhasil! Selamat bergabung dengan BESTARI.',
      user: newUser,
      token: `token-mock-${Date.now()}`,
    };
  },

  // Login user service
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (!payload.email || !payload.password) {
      return {
        success: false,
        message: 'Mohon masukkan email dan kata sandi Anda.',
      };
    }

    const cleanInput = payload.email.trim().toLowerCase();

    // Admin Authentication Check - matches any email/username with admin or password admin
    if (
      cleanInput.includes('admin') ||
      payload.password.toLowerCase() === 'admin123' ||
      payload.password.toLowerCase() === 'admin'
    ) {
      const adminUser: User = {
        id: 'user-admin-01',
        name: 'Administrator Bestari',
        email: cleanInput.includes('@') ? cleanInput : 'admin@bestari.com',
        role: 'admin',
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
      } catch {
        // ignore
      }

      return {
        success: true,
        message: 'Berhasil masuk sebagai Administrator!',
        user: adminUser,
        token: `token-admin-${Date.now()}`,
      };
    }

    // Default mock user login
    const user: User = {
      id: `user-${Date.now()}`,
      name: payload.email.split('@')[0] || 'Pelanggan Bestari',
      email: payload.email,
      role: 'user',
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }

    return {
      success: true,
      message: 'Berhasil masuk! Selamat datang kembali.',
      user,
      token: `token-mock-${Date.now()}`,
    };
  },

  // Get current session
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: User = JSON.parse(saved);
        if (
          parsed.email?.toLowerCase() === 'admin@bestari.com' ||
          parsed.id === 'user-admin-01'
        ) {
          parsed.role = 'admin';
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  },

  // Logout
  logout: async (): Promise<boolean> => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return true;
  },
};
