import fetch from 'node-fetch';

// Auto-translate konten landing (ID -> EN) memakai endpoint publik Google Translate
// (translate.googleapis.com/translate_a/single?client=gtx) — GRATIS tanpa API key.
//
// Catatan: endpoint ini unofficial (dipakai situs translate.google.com). Untuk
// pemakaian admin simpan konten (beberapa field, sesekali) ini cukup stabil.
// Kalau suatu hari berubah/diblokir, ganti implementasi translateIdToEn() di file
// ini saja — pemanggil (routes) tidak berubah.

const GTX_URL = 'https://translate.googleapis.com/translate_a/single';

// Jeda antar request ke Google (rate-limit per IP). Sequential + jeda kecil
// supaya simpan konten (banyak field) tidak kena HTTP 429.
const REQUEST_INTERVAL_MS = 1200;
let lastRequestAt = 0;

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + REQUEST_INTERVAL_MS - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export async function translateIdToEn(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';
  // Kalau sudah tidak mengandung huruf Latin umum Indonesia (angka/URL/emoji saja),
  // jangan buang waktu — kembalikan apa adanya. Deteksi sederhana: harus ada
  // minimal satu huruf alfabet.
  if (!/[A-Za-z]/.test(clean)) return clean;

  const url = `${GTX_URL}?client=gtx&sl=id&tl=en&dt=t&q=${encodeURIComponent(clean)}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    await throttle();
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BestariBot/1.0)' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 429 && attempt === 0) {
        // rate limit — tunggu 3.5s lalu coba sekali lagi
        await new Promise((r) => setTimeout(r, 3500));
        continue;
      }
      if (!res.ok) {
        throw new Error(`Translate API HTTP ${res.status}`);
      }
      const data = (await res.json()) as unknown[];
      const segments: string[] = [];
      const first = data[0];
      if (Array.isArray(first)) {
        for (const seg of first) {
          if (Array.isArray(seg) && typeof seg[0] === 'string') segments.push(seg[0]);
        }
      }
      const out = segments.join('').trim();
      return out || clean;
    } catch (e) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw e;
    }
  }
  throw new Error('Translate API gagal setelah retry');
}

// Terjemahkan semua field berakhiran `Id` menjadi pasangan `En` (hapus akhiran `Id` -> `En`).
// Contoh: { heroTitleId: 'Halo' } -> { heroTitleId: 'Halo', heroTitleEn: 'Hello' }.
// Field `En` yang dikirim pemanggil DIABAIKAN (sumber EN = otomatis).
export async function translateFieldsIdToEn(
  fields: Record<string, string>,
): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...fields };

  for (const [key, value] of Object.entries(fields)) {
    if (!key.endsWith('Id')) continue;
    const enKey = key.slice(0, -2) + 'En'; // "heroTitleId" -> "heroTitleEn"
    if (!value || typeof value !== 'string') continue;
    if (result[enKey] !== undefined) {
      delete result[enKey]; // jangan percaya EN manual
    }
    try {
      const translated = await translateIdToEn(value);
      if (translated) result[enKey] = translated;
    } catch (e) {
      console.warn(`[translate] gagal terjemahkan ${key}:`, (e as Error).message);
      // gagal = biarkan EN kosong; FE fallback ke ID saat bahasa EN aktif
    }
  }

  return result;
}

// Helper khusus banner: judul ID -> title_en (kolom berbeda naming)
export async function translateBannerTitle(title: string): Promise<string | null> {
  if (!title || !title.trim()) return null;
  try {
    const out = await translateIdToEn(title);
    return out || null;
  } catch (e) {
    console.warn('[translate] gagal terjemahkan banner title:', (e as Error).message);
    return null;
  }
}
