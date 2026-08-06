import { Router, Request, Response } from 'express';
import { getLandingContent, upsertLandingContent } from '../services/landing_content_service';
import { authRequired, adminOnly } from '../middleware/auth';

const router = Router();

// Public — konten beranda (hero, story, benefit, featured)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getLandingContent();
    res.json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gagal mengambil konten landing page' });
  }
});

// Admin only — simpan/ubah konten beranda (partial update per field)
router.put('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const fields = (req.body && req.body.data) || req.body || {};
    if (typeof fields !== 'object' || Array.isArray(fields)) {
      res.status(400).json({ error: 'Body harus berupa objek field konten' });
      return;
    }
    // Whitelist key: hanya field string yang diterima (cegah injeksi key aneh)
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === 'string') clean[k] = v;
    }
    const n = await upsertLandingContent(clean);
    res.json({ message: `${n} konten beranda disimpan`, data: await getLandingContent() });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gagal menyimpan konten landing page' });
  }
});

export default router;
