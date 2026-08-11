import { Router, Request, Response } from 'express';
import { getSettings, updateSettings } from '../../services/admin/settings_service';
import { authRequired, adminOnly } from '../../middleware/auth';
import { eventBus, EVENTS } from '../../lib/eventBus';

const router = Router();
router.use(authRequired, adminOnly);

router.get('/', async (_req: Request, res: Response) => {
  const data = await getSettings();
  res.json({ data });
});

router.put('/', async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({ error: 'Minimal satu setting wajib diisi' });
    return;
  }
  await updateSettings(req.body);
  res.json({ message: 'Pengaturan disimpan' });
  eventBus.emit(EVENTS.SETTINGS, { action: 'update' });
});

export default router;
