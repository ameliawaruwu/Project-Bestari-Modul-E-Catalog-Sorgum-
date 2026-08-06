import { request, getToken } from './http';

export interface ShopSettings {
  storeName: string;
  logoUrl: string;
  qrisImageUrl: string;
  qrisNmid: string;
  whatsappNumber: string;
  qrisStatus: 'AKTIF' | 'NONAKTIF';
  shippingCost?: number;
}

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  storeName: 'SORGUM',
  logoUrl: '',
  qrisImageUrl: '',
  qrisNmid: '',
  whatsappNumber: '',
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
    shippingCost: map.shipping_cost ? parseInt(String(map.shipping_cost), 10) || 0 : undefined,
  };
}

export const shopSettingsApi = {
  // Sync variant — return default; state di-hydrate via getSettingsAsync di AppContext mount.
  getSettings: (): ShopSettings => DEFAULT_SHOP_SETTINGS,

  // Async variant — hydrate from backend (public endpoint)
  getSettingsAsync: async (): Promise<ShopSettings> => {
    try {
      const res = await request<{ data: Record<string, string> }>('/settings');
      if (res?.data) {
        return mapSettings(res.data);
      }
    } catch {
      // ignore — fallback below
    }

    // Admin-only fallback (when logged in as admin)
    if (getToken()) {
      try {
        const res = await request<{ data: Record<string, string> }>('/admin/settings');
        if (res?.data) {
          return mapSettings(res.data);
        }
      } catch {
        // ignore
      }
    }

    return DEFAULT_SHOP_SETTINGS;
  },

  saveSettings: (settings: Partial<ShopSettings>): ShopSettings => {
    // Persist to backend (admin). Tidak ada cache localStorage.
    const body: Record<string, string> = {
      store_name: settings.storeName || DEFAULT_SHOP_SETTINGS.storeName,
      store_logo: settings.logoUrl || '',
      qris_image_url: settings.qrisImageUrl || '',
      qris_nmid: settings.qrisNmid || '',
      whatsapp_number: settings.whatsappNumber || '',
      qris_status: settings.qrisStatus || 'AKTIF',
    };
    if (settings.shippingCost !== undefined) body.shipping_cost = String(settings.shippingCost);
    if (getToken()) {
      request('/admin/settings', { method: 'PUT', body, auth: true }).catch(() => {});
    }
    return { ...DEFAULT_SHOP_SETTINGS, ...settings };
  },
};
