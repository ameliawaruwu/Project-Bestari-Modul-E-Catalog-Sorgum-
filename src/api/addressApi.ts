import { request } from './http';

// Backend user address row (GET/POST/PUT/DELETE /api/user/)
export interface AddressRow {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
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
    province: a.province,
    postalCode: a.postal_code,
    isPrimary: !!a.is_primary,
  };
}

export const addressApi = {
  // GET /api/user/ — list alamat user (auth required)
  getAddresses: async (): Promise<ReturnType<typeof mapAddress>[]> => {
    try {
      const res = await request<{ data: AddressRow[] }>('/user/', { auth: true });
      return (res?.data || []).map(mapAddress);
    } catch {
      return [];
    }
  },

  // POST /api/user/ — tambah alamat
  createAddress: async (input: AddressInput): Promise<number | null> => {
    try {
      const res = await request<{ data: { id: number } }>('/user/', {
        method: 'POST',
        body: { ...input, is_primary: input.is_primary ? 1 : 0 },
        auth: true,
      });
      return res?.data?.id ?? null;
    } catch {
      return null;
    }
  },

  // PUT /api/user/:id — update alamat
  updateAddress: async (id: string, input: Partial<AddressInput>): Promise<boolean> => {
    try {
      await request(`/user/${id}`, {
        method: 'PUT',
        body: input.is_primary !== undefined ? { ...input, is_primary: input.is_primary ? 1 : 0 } : input,
        auth: true,
      });
      return true;
    } catch {
      return false;
    }
  },

  // DELETE /api/user/:id — hapus alamat
  deleteAddress: async (id: string): Promise<boolean> => {
    try {
      await request(`/user/${id}`, { method: 'DELETE', auth: true });
      return true;
    } catch {
      return false;
    }
  },
};
