import { Router, Request, Response } from 'express';
import dbPool from '../lib/db';

const router = Router();

// Kode ekspedisi yang dikenal layanan cek-resi (adjisoft/cekresi.com, alur baru).
// Disinkronkan dengan daftar https://cekresi.com/daftar-jasa-pengiriman/ (Juni 2026).
// Whitelist ini mencegah nilai arbitrer dikirim ke layanan eksternal.
const COURIER_CODES = new Set([
  // 14 ekspedisi utama (menu cekresi.com)
  'JNE', 'SPX', 'NINJA', 'LIONPARCEL', 'POS', 'TIKI', 'ANTERAJA', 'WAHANA',
  'INDAH', 'IDEXPRESS', 'PAXEL', 'SICEPAT', 'JET', 'JTCARGO',
  // Ekspedisi lain yang didukung cekresi.com (daftar jasa pengiriman)
  'JNE2ALT', 'WAHANA2ALT', 'SENTRALCARGO', 'ACOMMERCE', 'GTL', 'JANIO',
  'JETEXPRESS', 'PCP', 'NCS', 'NSS', 'RCL', 'QRIM', 'ARK', 'LWE', 'BEACUKAI',
  'KERRY', 'SF', 'EMS', 'JDL', 'JX', 'QUANTIUM', 'ESL', 'ETOBEE', 'KGP', 'KGX',
  'BARAKA', 'POSLAJU', 'CHOIR', 'YATAMA', 'ZDEX', 'ATEX', 'OEXPRESS', 'RPX',
  'REX', 'DUASATU', 'IKEA', 'SKYNET', 'ASP', 'ROSALIA', 'HERONA', 'FIRST',
  'ANTARAN', 'KALOG', 'INDOPAKET', 'CITYLINK', 'PAHALA', 'JTC',
  // Alias / kode lama yang masih mungkin dikirim
  'JT', 'NIN', 'LION', 'AXA', 'WAH', 'IDE', 'J&T', 'SAP', 'JEXPRESS', 'LEX',
]);

// Terjemahan alias umum → kode baku (dipakai kalau FE kirim nama, bukan kode).
// NOTE: normalizeCourier cek COURIER_CODES (uppercase) DULU, jadi alias di sini
// hanya perlu spelling yang TIDAK ada di COURIER_CODES (nama lengkap ekspedisi).
const COURIER_ALIASES: Record<string, string> = {
  'jnt': 'JET',
  'j&t': 'JET',
  'j&t express': 'JET',
  'sicepat': 'SICEPAT',
  'shopee express': 'SPX',
  'pos indonesia': 'POS',
  'ninja xpress': 'NINJA',
  'lion parcel': 'LIONPARCEL',
  'id express': 'IDEXPRESS',
  'jnt cargo': 'JTCARGO',
  'j&t cargo': 'JTCARGO',
  'indah cargo': 'INDAH',
  'indah logistik': 'INDAH',
  'wahana': 'WAHANA',
  'standard express': 'LWE',
  'citylink': 'CITYLINK',
  'city link': 'CITYLINK',
  '21 express': 'DUASATU',
  'j express': 'JX',
  'kirim express': 'REX',
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

  // ── Resi demo (diisi lewat fitur "Data Demo" di panel admin) ──────────────
  // Dicek LEBIH DULU sebelum memanggil layanan luar: resi yang terdaftar di
  // tabel demo_tracking dikembalikan dari salinan tersimpan, sehingga presentasi
  // tetap jalan walau internet/layanan cek-resi bermasalah. Resi lain tetap
  // dilacak live seperti biasa.
  try {
    const [rows] = await dbPool.query(
      'SELECT payload FROM demo_tracking WHERE tracking_number = ? LIMIT 1',
      [resi.toUpperCase()],
    );
    const row = (rows as Array<{ payload: unknown }>)[0];
    if (row) {
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      res.json({ status: 'ok', data: { valid: true, data: payload } });
      return;
    }
  } catch {
    // Tabel demo belum ada / DB bermasalah → jangan blokir pelacakan asli.
  }

  const CEK_RESI_URL = process.env.CEK_RESI_URL || 'http://localhost:3001/cek-resi';
  const url = `${CEK_RESI_URL}/${encodeURIComponent(resi)}${courier ? `?exp=${encodeURIComponent(courier)}` : ''}`;

  try {
    // Timeout 45s (cekresi.com kadang lambat; request valid bisa makan 30-40s)
    const r = await fetch(url, { signal: AbortSignal.timeout(45000) });
    const json: any = await r.json().catch(() => null);

    // Teruskan status & body cek-resi apa adanya (ok/not_found/error + kode + detail)
    // supaya FE bisa tampilkan pesan jujur sesuai klasifikasi, bukan flatten 500 mentah.
    if (!r.ok) {
      res.status(r.status).json(json || {
        status: 'error',
        message: 'Layanan cek-resi mengembalikan error tanpa detail.',
        kode: 'UPSTREAM_EMPTY_ERROR',
      });
      return;
    }
    res.json(json);
  } catch (e: any) {
    // Bedakan: timeout / layanan mati
    const msg = String(e?.message || e);
    const isTimeout = /timeout|abort/i.test(msg);
    res.status(isTimeout ? 504 : 502).json({
      status: 'error',
      message: isTimeout
        ? 'Layanan pelacakan tidak merespons tepat waktu. Coba lagi nanti.'
        : 'Layanan cek-resi tidak tersedia. Coba lagi.',
      detail: msg.slice(0, 300),
      kode: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_DOWN',
    });
  }
});

export default router;
