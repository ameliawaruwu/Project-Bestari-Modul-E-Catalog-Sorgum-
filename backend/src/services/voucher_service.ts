import dbPool from '../lib/db';

export interface Voucher {
  id: number;
  code: string;
  discount_amount: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const voucherService = {
  async list(): Promise<Voucher[]> {
    const [rows] = await dbPool.query('SELECT * FROM vouchers ORDER BY created_at DESC');
    return rows as Voucher[];
  },

  // Voucher yang AKTIF & belum expired & masih punya kuota — untuk ditampilkan ke user (public)
  async listActive(): Promise<Voucher[]> {
    const [rows] = await dbPool.query(
      `SELECT * FROM vouchers
       WHERE is_active = 1
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)
       ORDER BY created_at DESC`
    );
    return rows as Voucher[];
  },

  async create(data: Partial<Voucher>) {
    const [res] = await dbPool.query('INSERT INTO vouchers SET ?', data);
    return res;
  },

  async update(id: number, data: Partial<Voucher>) {
    await dbPool.query('UPDATE vouchers SET ? WHERE id = ?', [data, id]);
  },

  async remove(id: number) {
    await dbPool.query('DELETE FROM vouchers WHERE id = ?', [id]);
  },

  async validate(code: string, subtotal: number): Promise<{ valid: boolean; discount?: number; voucher?: Voucher; message?: string }> {
    const [rows] = await dbPool.query(
      `SELECT * FROM vouchers
       WHERE code = ? AND is_active = 1
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [code.trim().toUpperCase()]
    );
    const v = (rows as Voucher[])[0];
    if (!v) {
      return { valid: false, message: 'Kode voucher tidak valid atau sudah kadaluarsa.' };
    }
    if (subtotal < v.min_purchase) {
      return {
        valid: false,
        message: `Minimal belanja Rp ${v.min_purchase.toLocaleString('id-ID')} untuk menggunakan voucher ini.`,
      };
    }
    return { valid: true, discount: v.discount_amount, voucher: v };
  },

  async incrementUsage(id: number) {
    await dbPool.query('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [id]);
  },
};
