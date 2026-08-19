import { Router, Request, Response } from 'express';
import { getDashboardMetrics } from '../../services/admin/dashboard_service';
import { getAllUsers, createUser, updateUserByAdmin, deleteUserByAdmin } from '../../services/admin/users_service';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

// Dashboard
router.get('/', async (_req: Request, res: Response) => {
  const data = await getDashboardMetrics();
  res.json({ data });
});

// Users
router.get('/users', async (_req: Request, res: Response) => {
  const data = await getAllUsers();
  res.json({ data });
});

router.post('/users', async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, password wajib' });
    return;
  }

  try {
    await createUser(name, email, password, phone);
    res.status(201).json({ message: 'User berhasil dibuat' });
  } catch (e: any) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const allowed = ['name', 'email', 'phone', 'password', 'is_deleted', 'role'];
  const fields: Record<string, any> = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) fields[k] = req.body[k];
  }
  // Validasi role — hanya 'user' | 'admin' yang diterima (mencegah nilai liar).
  if (fields.role !== undefined && !['user', 'admin'].includes(fields.role)) {
    res.status(400).json({ error: 'Role tidak valid. Gunakan "user" atau "admin".' });
    return;
  }

  const updated = await updateUserByAdmin(id, fields);
  if (!updated) { res.status(404).json({ error: 'User tidak ditemukan' }); return; }
  res.json({ message: 'User diupdate' });
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const deleted = await deleteUserByAdmin(id);
  if (!deleted) { res.status(404).json({ error: 'User tidak ditemukan' }); return; }
  res.json({ message: 'User dihapus' });
});

export default router;
