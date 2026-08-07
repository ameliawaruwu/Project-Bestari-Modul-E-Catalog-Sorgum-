// Unit test — auth_service (regresi bug 2: phone di register & login)
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dbPool SEBELUM import service
const mockQuery = vi.fn();
vi.mock('../src/lib/db', () => ({ default: { query: (...args) => mockQuery(...args) } }));

import { register, login } from '../src/services/auth_service';

describe('auth_service', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('register menyimpan phone ke INSERT users', async () => {
    mockQuery
      .mockResolvedValueOnce([[]]) // SELECT cek email duplikat → kosong
      .mockResolvedValueOnce([[{ insertId: 10 }]]) // INSERT (mysql2: [ResultSet])
      .mockResolvedValueOnce([[{ id: 10, name: 'QA', email: 'a@b.c', phone: '81234567890', role: 'user' }]]); // SELECT balik
    const user = await register({ name: 'QA', email: 'a@b.c', password: 'secret123', phone: '81234567890' });

    // INSERT query harus membawa phone (call index 1 = INSERT, setelah SELECT cek duplikat)
    const insertCall = mockQuery.mock.calls.find((c) => c[0].includes('INSERT INTO users'));
    expect(insertCall).toBeDefined();
    expect(insertCall![0]).toContain('phone');
    expect(insertCall![1]).toContain('81234567890');
    expect(user.phone).toBe('81234567890');
  });

  it('login return phone (SELECT users menyertakan phone)', async () => {
    mockQuery.mockResolvedValueOnce([[{
      id: 5, name: 'QA', email: 'a@b.c', phone: '81234567890',
      password_hash: '$2b$10$invalid', role: 'user', is_deleted: 0,
    }]]);
    // bcrypt.compare akan gagal dengan hash invalid → login error
    await expect(login({ email: 'a@b.c', password: 'x' })).rejects.toThrow();
    // TAPI pastikan query SELECT menyertakan phone (regresi bug 2)
    expect(mockQuery.mock.calls[0][0]).toContain('phone');
  });
});
