import { Router, Request, Response } from 'express';
import { getProfile, updateProfile, changePassword } from '../../services/user/profile_service';
import { authRequired } from '../../middleware/auth';

const router = Router();
router.use(authRequired);

router.get('/profile', async (req: Request, res: Response) => {
  const profile = await getProfile(req.user!.userId);
  res.json({ data: profile });
});

router.put('/profile', async (req: Request, res: Response) => {
  const allowed = ['name', 'email', 'phone'];
  const fields: Record<string, any> = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) fields[k] = req.body[k];
  }
  if (Object.keys(fields).length === 0) {
    res.status(400).json({ error: 'Tidak ada data yang diupdate' });
    return;
  }
  const profile = await updateProfile(req.user!.userId, fields);
  res.json({ message: 'Profil diupdate', data: profile });
});

router.put('/change-password', async (req: Request, res: Response) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) { res.status(400).json({ error: 'old_password dan new_password wajib' }); return; }
  if (new_password.length < 6) { res.status(400).json({ error: 'Password baru minimal 6 karakter' }); return; }

  try {
    await changePassword(req.user!.userId, old_password, new_password);
    res.json({ message: 'Password berhasil diubah' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
