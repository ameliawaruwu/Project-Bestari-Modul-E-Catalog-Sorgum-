import dbPool from '../lib/db';

export interface Voucher {
  id: number;
  code: string;
  type: 'fixed' | 'percent';
  discount_amount: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Normalisasi payload voucher dari admin (create/update) — jaga integritas data:
// - code di-uppercase & trim (konsisten dengan validate() yang query UPPER)
// - type HANYA 'fixed' | 'percent' (selain itu → 'fixed' supaya diskon tidak salah hitung)
// - discount_amount/min_purchase dipaksa angka ≥ 0
// - max_uses: '' / undefined / <1 → null (unlimited); angka → integer
// - expires_at: '' / null → null (tanpa kadaluarsa)
// - is_active dipaksa boolean
function normalizeVoucherInput(data: Partial<Voucher>): Record<string, any> {
  const out: Record<string, any> = { ...data };
  if (out.code !== undefined) out.code = String(out.code).trim().toUpperCase();
  if (out.type !== undefined) {
    out.type = out.type === 'percent' ? 'percent' : 'fixed';
  }
  if (out.discount_amount !== undefined) {
    out.discount_amount = Math.max(0, Math.round(Number(out.discount_amount) || 0));
  }
  if (out.min_purchase !== undefined) {
    out.min_purchase = Math.max(0, Math.round(Number(out.min_purchase) || 0));
  }
  if (out.max_uses !== undefined) {
    const n = parseInt(String(out.max_uses), 10);
    out.max_uses = Number.isFinite(n) && n > 0 ? n : null;
  }
  if (out.expires_at !== undefined) {
    out.expires_at = out.expires_at ? String(out.expires_at) : null;
  }
  if (out.is_active !== undefined) out.is_active = out.is_active ? 1 : 0;
  return out;
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
    const clean = normalizeVoucherInput(data);
    const [res] = await dbPool.query('INSERT INTO vouchers SET ?', clean);
    return res;
  },

  async update(id: number, data: Partial<Voucher>) {
    const clean = normalizeVoucherInput(data);
    await dbPool.query('UPDATE vouchers SET ? WHERE id = ?', [clean, id]);
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
    // Diskon sesuai tipe: fixed = nominal Rp; percent = % dari subtotal.
    const discount =
      v.type === 'percent'
        ? Math.min(Math.round((v.discount_amount / 100) * subtotal), subtotal)
        : Math.min(v.discount_amount, subtotal);
    return { valid: true, discount, voucher: v };
  },

  async incrementUsage(id: number) {
    await dbPool.query('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [id]);
  },
};
