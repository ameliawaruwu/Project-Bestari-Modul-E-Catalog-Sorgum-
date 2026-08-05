import dbPool from '../../lib/db';

interface AddressRow {
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

export async function getAddresses(userId: number): Promise<AddressRow[]> {
  const [rows] = await dbPool.query(
    'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_primary DESC, id ASC',
    [userId],
  );
  return rows as AddressRow[];
}

export async function createAddress(userId: number, fields: Record<string, any>) {
  const [r] = await dbPool.query(
    `INSERT INTO user_addresses (user_id, label, recipient_name, phone, address_line, city, province, postal_code, is_primary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, fields.label, fields.recipient_name, fields.phone,
     fields.address_line, fields.city, fields.province, fields.postal_code,
     fields.is_primary ? 1 : 0],
  );
  return (r as any).insertId;
}

const ADDRESS_ALLOWED_COLUMNS = ['label', 'recipient_name', 'phone', 'address_line', 'city', 'province', 'postal_code', 'is_primary'];

export async function updateAddress(addressId: number, userId: number, fields: Record<string, any>) {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    // Whitelist kolom — cegah SQL injection via dynamic column name
    if (!ADDRESS_ALLOWED_COLUMNS.includes(k)) continue;
    if (v === undefined) continue;
    sets.push(`${k} = ?`);
    vals.push(k === 'is_primary' ? (v ? 1 : 0) : v);
  }
  if (sets.length === 0) return false;
  vals.push(addressId, userId);
  const [r] = await dbPool.query(`UPDATE user_addresses SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, vals);
  return (r as any).affectedRows > 0;
}

export async function deleteAddress(addressId: number, userId: number) {
  const [r] = await dbPool.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
  return (r as any).affectedRows > 0;
}
