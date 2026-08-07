// Unit test — cart_service (owner_key unik, upsert qty)
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('../src/lib/db', () => ({ default: { query: (...args) => mockQuery(...args) } }));

import { addToCart, getCart, removeFromCart } from '../src/services/cart_service';

describe('cart_service', () => {
  beforeEach(() => mockQuery.mockReset());

  it('addToCart dengan userId → owner_key u<id>: dan user_id terisi', async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]);
    await addToCart(26, 2, 125, undefined);
    const [q, params] = mockQuery.mock.calls[0];
    expect(q).toContain('INSERT INTO cart_items');
    expect(q).toContain('ON DUPLICATE KEY UPDATE');
    expect(params[0]).toBe(125);      // user_id
    expect(params[1]).toBeNull();     // session_id
    expect(params[2]).toBe('u125:');  // owner_key
    expect(params[3]).toBe(26);       // product_id
    expect(params[4]).toBe(2);        // quantity
  });

  it('addToCart dengan sessionId → owner_key s<sid>:', async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 2, affectedRows: 1 }]);
    await addToCart(26, 1, undefined, 'abc123');
    const [q, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBeNull();
    expect(params[1]).toBe('abc123');
    expect(params[2]).toBe('sabc123');
  });

  it('addToCart tanpa userId & sessionId → throw AppError 400', async () => {
    await expect(addToCart(26, 1)).rejects.toThrow('user_id atau session_id diperlukan');
  });

  it('getCart: ITEM_SELECT join products + primary_image subquery', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    await getCart(125);
    const q = mockQuery.mock.calls[0][0];
    expect(q).toContain('product_images');
    expect(q).toContain('is_primary = 1');
    expect(q).toContain('WHERE c.user_id = ?');
  });

  it('removeFromCart: DELETE dibatasi owner (tidak bisa hapus cart orang lain)', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const ok = await removeFromCart(99, 125);
    const [q, params] = mockQuery.mock.calls[0];
    expect(q).toContain('DELETE c FROM cart_items c WHERE id = ? AND c.user_id = ?');
    expect(params).toEqual([99, 125]);
    expect(ok).toBe(false); // affectedRows 0 → bukan milik user
  });
});
