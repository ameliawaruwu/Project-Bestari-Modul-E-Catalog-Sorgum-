import { request, getToken } from './http';

export interface ShopSettings {
  storeName: string;
  logoUrl: string;
  qrisImageUrl: string;
  qrisNmid: string;
  whatsappNumber: string;
  qrisStatus: 'AKTIF' | 'NONAKTIF';
}

const LOCAL_STORAGE_KEY = 'bestari_shop_settings_v1';

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  storeName: 'BESTARI Sorghum',
  logoUrl: '',
  qrisImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAIKWh-z2qzILYDC9woreBeFgSVM7_5bAXQw5pYZ_WwXgCifGERVX51aW8YsqJjhz82BHNB45qL6bJnxNWBWwpAxsM67_7x2OTYNFuUS0K4XILgSk6ErmPXJ-UP3WMQhaf0M_b3gWRwVKHSZ6kbqzO0x1MUI3RpV0ldxSddeaWujNrHtPTNPk0WLMpMDYC-ht49m3cEFZM04MALEK2_xXvp7VSo9wE4R95RE8g09iTX-hLm7IdsDkg',
  qrisNmid: 'ID1029384756382',
  whatsappNumber: '+62 812-3456-7890',
  qrisStatus: 'AKTIF',
};

// Map backend site_settings (key-value map) -> ShopSettings
function mapSettings(map: Record<string, string>): ShopSettings {
  return {
    storeName: map.store_name || DEFAULT_SHOP_SETTINGS.storeName,
    logoUrl: map.store_logo || '',
    qrisImageUrl: map.qris_image_url || DEFAULT_SHOP_SETTINGS.qrisImageUrl,
    qrisNmid: map.qris_nmid || DEFAULT_SHOP_SETTINGS.qrisNmid,
    whatsappNumber: map.whatsapp_number || DEFAULT_SHOP_SETTINGS.whatsappNumber,
    qrisStatus: (map.qris_status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF'),
  };
}

function readCache(): ShopSettings | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShopSettings) : null;
  } catch {
    return null;
  }
}

function writeCache(s: ShopSettings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export const shopSettingsApi = {
  getSettings: (): ShopSettings => {
    // Try backend first (public endpoint). Sync — but we can't await here (FE expects sync).
    // Fallback: use cache or defaults. Server fetch happens in getSettingsAsync.
    return readCache() || DEFAULT_SHOP_SETTINGS;
  },

  // Async variant — used at app startup to hydrate from backend
  getSettingsAsync: async (): Promise<ShopSettings> => {
    try {
      // Public settings endpoint (admin fallback if token present)
      const res = await request<{ data: Record<string, string> }>('/settings');
      if (res?.data) {
        const mapped = mapSettings(res.data);
        writeCache(mapped);
        return mapped;
      }
    } catch {
      // ignore — fallback below
    }

    // Admin-only fallback (when logged in as admin)
    if (getToken()) {
      try {
        const res = await request<{ data: Record<string, string> }>('/admin/settings');
        if (res?.data) {
          const mapped = mapSettings(res.data);
          writeCache(mapped);
          return mapped;
        }
      } catch {
        // ignore
      }
    }

    return readCache() || DEFAULT_SHOP_SETTINGS;
  },

  saveSettings: (settings: Partial<ShopSettings>): ShopSettings => {
    // Save locally immediately (optimistic)
    const current = shopSettingsApi.getSettings();
    const updated = { ...current, ...settings };
    writeCache(updated);

    // Persist to backend (admin). Fire-and-forget; failure stays local.
    const keyMap: Record<string, string> = {
      storeName: 'store_name',
      logoUrl: 'store_logo',
      qrisImageUrl: 'qris_image_url',
      qrisNmid: 'qris_nmid',
      whatsappNumber: 'whatsapp_number',
      qrisStatus: 'qris_status',
    };
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(updated)) {
      const key = keyMap[k];
      if (key) body[key] = String(v);
    }
    if (getToken()) {
      request('/admin/settings', { method: 'PUT', body, auth: true }).catch(() => {});
    }
    return updated;
  },
};
