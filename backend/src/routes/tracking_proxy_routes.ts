import { Router, Request, Response } from 'express';

const router = Router();

// Kode ekspedisi yang dikenal layanan cek-resi (adjisoft/cekresi.com, alur baru).
// Whitelist ini mencegah nilai arbitrer dikirim ke layanan eksternal.
const COURIER_CODES = new Set([
  'JNE', 'JNE2ALT', 'JT', 'SPX', 'TIKI', 'POS', 'NINJA', 'NIN', 'LIONPARCEL', 'LION',
  'ANTERAJA', 'AXA', 'WAHANA', 'WAH', 'CITYLINK', 'RCL', 'JX', 'SAP', 'JET', 'IDEXPRESS',
  'IDE', 'REX', 'KGX', 'ZDEX', 'KERRY', 'SF', 'OEXPRESS', 'QRIM', 'ARK', 'BEACUKAI', 'PCP',
  'JDL', 'ROSALIA', 'INDOPAKET', 'PAHALA', 'KALOG', 'PAXEL', 'NSS', 'LWE', 'FIRST', 'INDAH',
  'JTC', 'J&T', 'ANTARAN',
]);

// Terjemahan alias umum → kode baku (dipakai kalau FE kirim nama, bukan kode).
// NOTE: normalizeCourier cek COURIER_CODES (uppercase) DULU, jadi alias di sini
// hanya perlu spelling yang TIDAK ada di COURIER_CODES (nama lengkap ekspedisi).
const COURIER_ALIASES: Record<string, string> = {
  'jnt': 'JT',
  'sicepat': 'SPX',
  'pos indonesia': 'POS',
  'ninja xpress': 'NINJA',
  'lion parcel': 'LIONPARCEL',
  'id express': 'IDEXPRESS',
  'jnt cargo': 'JTC',
};

function normalizeCourier(raw: string): string {
  const v = raw.trim().toUpperCase();
  if (COURIER_CODES.has(v)) return v;
  return COURIER_ALIASES[v.toLowerCase()] || '';
}

router.get('/:resi', async (req: Request, res: Response) => {
  const resi = String(req.params.resi || '').trim();
  const courier = normalizeCourier(String(req.query.courier || '').trim());
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
