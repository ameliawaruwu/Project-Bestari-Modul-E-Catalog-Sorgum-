import { Router, Request, Response } from 'express';

const router = Router();

router.get('/:resi', async (req: Request, res: Response) => {
  const resi = String(req.params.resi || '').trim();
  const courier = String(req.query.courier || '').trim();
  if (!resi) { res.status(400).json({ error: 'Resi wajib diisi' }); return; }

  const CEK_RESI_URL = process.env.CEK_RESI_URL || 'http://localhost:3001/cek-resi';
  const url = `${CEK_RESI_URL}/${encodeURIComponent(resi)}${courier ? `?exp=${encodeURIComponent(courier)}` : ''}`;

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const json: any = await r.json().catch(() => null);
    if (!r.ok) {
      res.status(r.status).json(json || { error: 'Gagal dari layanan cek-resi' });
      return;
    }
    res.json(json);
  } catch {
    res.status(502).json({ error: 'Layanan cek-resi tidak tersedia. Coba lagi.' });
  }
});

export default router;
