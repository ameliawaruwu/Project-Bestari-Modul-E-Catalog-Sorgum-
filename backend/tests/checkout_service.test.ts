// Unit test — checkout_service (regresi bug 3: order_items menyimpan image_url snapshot)
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted — variabel mock bisa dipakai di factory vi.mock (hoisted ke atas)
const { conn, mockDbPool } = vi.hoisted(() => ({
  conn: {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
    query: vi.fn(),
  },
  mockDbPool: {
    getConnection: vi.fn(),
    query: vi.fn(),
  },
}));

vi.mock('../src/lib/db', () => ({ default: mockDbPool }));

vi.mock('../src/services/cart_service', () => ({
  getCart: vi.fn(),
}));
vi.mock('../src/services/voucher_service', () => ({
  voucherService: { validate: vi.fn() },
}));

import { createOrder } from '../src/services/checkout_service';
import { getCart } from '../src/services/cart_service';
import { voucherService } from '../src/services/voucher_service';

const cartItem = {
  id: 1, user_id: 125, session_id: null, product_id: 26, quantity: 2,
  product_name: 'QA Produk', product_slug: 'qa-produk', price: 10000, stock: 10,
  primary_image: '/uploads/gambar.png',
};

const addr = {
  label: 'Alamat', recipient_name: 'QA', phone: '8123456789',
  address_line: 'Jl Test', city: 'Bandung', province: 'Jabar', postal_code: '40111',
};

describe('checkout_service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbPool.getConnection.mockResolvedValue(conn);
    // generateUniqueOrderNumber → cek nomor order via dbPool.query (Once, kosong)
    mockDbPool.query.mockResolvedValueOnce([[]]);
    // SELECT order balik (setelah commit) → order ditemukan (Once)
    mockDbPool.query.mockResolvedValueOnce([[{ id: 99, order_number: 'BST-1', shipping_address: '{}', total: 20000 }]]);
    conn.query.mockReset();
    // Urutan query di createOrder (1 cart item):
    // 1. INSERT orders → 2. INSERT order_items → 3. SELECT stock FOR UPDATE → 4. UPDATE stock → 5. DELETE cart
    conn.query
      .mockResolvedValueOnce([[{ insertId: 99, affectedRows: 1 }]]) // INSERT orders
      .mockResolvedValueOnce([{ affectedRows: 1 }])                  // INSERT order_items
      .mockResolvedValueOnce([[{ stock: 10 }]])                      // SELECT stock FOR UPDATE
      .mockResolvedValueOnce([{ affectedRows: 1 }])                  // UPDATE stock
      .mockResolvedValueOnce([{ affectedRows: 1 }]);                 // DELETE cart
  });

  it('checkout: order_items INSERT menyertakan image_url (snapshot bug 3)', async () => {
    getCart.mockResolvedValue([cartItem]);
    voucherService.validate.mockResolvedValue({ valid: false });

    await createOrder({
      userId: 125, customer_name: 'QA', customer_phone: '8123456789',
      shipping_address: addr, payment_method: 'cod',
    });

    // Cari INSERT order_items
    const insertItem = conn.query.mock.calls.find((c) => c[0].includes('INSERT INTO order_items'));
    expect(insertItem).toBeTruthy();
    expect(insertItem![0]).toContain('image_url');
    // params: order_id, product_id, product_name, image_url, price, qty, subtotal
    const p = insertItem![1];
    expect(p[1]).toBe(26);
    expect(p[3]).toBe('/uploads/gambar.png'); // snapshot image tersimpan!
    expect(p[6]).toBe(20000); // subtotal 2 × 10000
  });

  it('checkout: cart kosong → throw AppError 400', async () => {
    getCart.mockResolvedValue([]);
    await expect(createOrder({
      userId: 125, customer_name: 'QA', customer_phone: '8123456789',
      shipping_address: addr, payment_method: 'cod',
    })).rejects.toThrow('Keranjang kosong');
    // tidak ada transaksi dimulai
    expect(mockDbPool.getConnection).not.toHaveBeenCalled();
  });
});
