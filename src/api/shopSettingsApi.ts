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
  logoUrl: '', // Empty string means standard brand typography logo
  qrisImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAIKWh-z2qzILYDC9woreBeFgSVM7_5bAXQw5pYZ_WwXgCifGERVX51aW8YsqJjhz82BHNB45qL6bJnxNWBWwpAxsM67_7x2OTYNFuUS0K4XILgSk6ErmPXJ-UP3WMQhaf0M_b3gWRwVKHSZ6kbqzO0x1MUI3RpV0ldxSddeaWujNrHtPTNPk0WLMpMDYC-ht49m3cEFZM04MALEK2_xXvp7VSo9wE4R95RE8g09iTX-hLm7IdsDkg',
  qrisNmid: 'ID1029384756382',
  whatsappNumber: '+62 812-3456-7890',
  qrisStatus: 'AKTIF',
};

export const shopSettingsApi = {
  getSettings: (): ShopSettings => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SHOP_SETTINGS,
          ...parsed,
        };
      }
    } catch (e) {
      console.error('Error reading shop settings:', e);
    }
    return DEFAULT_SHOP_SETTINGS;
  },

  saveSettings: (settings: Partial<ShopSettings>): ShopSettings => {
    try {
      const current = shopSettingsApi.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving shop settings:', e);
      return shopSettingsApi.getSettings();
    }
  },
};
