// Unit test — voucher_service (diskon per tipe: fixed / percent, minimal belanja)
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('../src/lib/db', () => ({ default: { query: (...args) => mockQuery(...args) } }));

import { voucherService } from '../src/services/voucher_service';

function makeVoucher(over: Record<string, any> = {}) {
  return {
    id: 1, code: 'TEST10', type: 'fixed', discount_amount: 10000, min_purchase: 50000,
    max_uses: 100, used_count: 0, is_active: true, expires_at: null,
    ...over,
  };
}

describe('voucherService', () => {
  beforeEach(() => mockQuery.mockReset());

  it('validate: voucher tidak ditemukan → invalid', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const r = await voucherService.validate('GAKADA', 100000);
    expect(r.valid).toBe(false);
    expect(r.message).toContain('tidak valid');
  });

  it('validate: subtotal < min_purchase → invalid', async () => {
    mockQuery.mockResolvedValueOnce([[makeVoucher()]]);
    const r = await voucherService.validate('TEST10', 30000);
    expect(r.valid).toBe(false);
    expect(r.message).toContain('Minimal belanja');
  });

  it('validate: tipe fixed → diskon nominal, tidak lebih dari subtotal', async () => {
    mockQuery.mockResolvedValueOnce([[makeVoucher()]]);
    const r = await voucherService.validate('TEST10', 100000);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(10000);
  });

  it('validate: tipe percent → diskon % subtotal, dibatasi subtotal', async () => {
    mockQuery.mockResolvedValueOnce([[makeVoucher({ type: 'percent', discount_amount: 25 }),]]);
    const r = await voucherService.validate('PCT25', 100000);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(25000);
  });

  it('validate: diskon percent > subtotal → dibatasi subtotal', async () => {
    mockQuery.mockResolvedValueOnce([[makeVoucher({ type: 'percent', discount_amount: 200, min_purchase: 0 }),]]);
    const r = await voucherService.validate('PCT200', 10000);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(10000); // tidak pernah negatif/lebih dari subtotal
  });

  it('listActive: query filter is_active + expires_at + max_uses', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    await voucherService.listActive();
    const q = mockQuery.mock.calls[0][0];
    expect(q).toContain('is_active = 1');
    expect(q).toContain('expires_at');
    expect(q).toContain('used_count < max_uses');
  });
});
