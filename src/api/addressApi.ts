import { request } from './http';

// Backend user address row (GET/POST/PUT/DELETE /api/user/)
export interface AddressRow {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  district?: string | null;
  province: string;
  postal_code: string;
  is_primary: number;
}

export interface AddressInput {
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  district?: string;
  province: string;
  postal_code: string;
  is_primary?: boolean;
}

function mapAddress(a: AddressRow) {
  return {
    id: String(a.id),
    label: a.label,
    recipientName: a.recipient_name,
    phone: a.phone,
    addressLine: a.address_line,
    city: a.city,
    district: a.district || '',
    province: a.province,
    postalCode: a.postal_code,
    isPrimary: !!a.is_primary,
  };
}

export const addressApi = {
  // GET /api/user/ — list alamat user (auth required). THROW error BE biar caller tahu.
  getAddresses: async (): Promise<ReturnType<typeof mapAddress>[]> => {
    const res = await request<{ data: AddressRow[] }>('/user/', { auth: true });
    return (res?.data || []).map(mapAddress);
  },

  // Upsert alamat utama (primary) — get → cari primary (jangan asumsi [0]) → create/update.
  // Dipakai oleh CheckoutPage & ProfilePage supaya logika tersimpan di satu tempat.
  // THROW error dari BE (mis. validasi) — caller menampilkan e.message ke user.
  upsertPrimaryAddress: async (input: AddressInput): Promise<boolean> => {
    const list = await addressApi.getAddresses();
    const primary = list.find((a) => a.isPrimary) || list[0];
    if (primary) {
      await addressApi.updateAddress(primary.id, input);
      return true;
    }
    const id = await addressApi.createAddress(input);
    return id !== null;
  },

  // POST /api/user/ — tambah alamat. THROW error BE (validasi dll) biar caller bisa tampilkan.
  createAddress: async (input: AddressInput): Promise<number | null> => {
    const res = await request<{ data: { id: number } }>('/user/', {
      method: 'POST',
      body: { ...input, is_primary: input.is_primary ? 1 : 0 },
      auth: true,
    });
    return res?.data?.id ?? null;
  },

  // PUT /api/user/:id — update alamat. THROW error BE biar caller bisa tampilkan.
  updateAddress: async (id: string, input: Partial<AddressInput>): Promise<boolean> => {
    await request(`/user/${id}`, {
      method: 'PUT',
      body: input.is_primary !== undefined ? { ...input, is_primary: input.is_primary ? 1 : 0 } : input,
      auth: true,
    });
    return true;
  },

  // DELETE /api/user/:id — hapus alamat. THROW error BE biar caller bisa tampilkan.
  deleteAddress: async (id: string): Promise<boolean> => {
    await request(`/user/${id}`, { method: 'DELETE', auth: true });
    return true;
  },
};
