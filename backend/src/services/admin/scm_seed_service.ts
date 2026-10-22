import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dbPool from '../../lib/db';
import { config } from '../../lib/config';
import { AppError } from '../../lib/errors_utils';
import seedData from '../../data/demo_seed.json';
import { upsertLandingContent } from '../landing_content_service';

// ---------------------------------------------------------------------------
// SCM Seeder — ambil produk olahan dari API SCM, ubah ke format produk toko.
//
// SCM hanya punya: id, name, satuanHasil, deskripsi, fotoUrl, isActive.
// Tidak ada harga / kategori / berat. Karena itu:
//   - nama, deskripsi, status aktif, foto  → dari SCM
//   - harga, kategori, berat, komposisi, dst → dari produk lama yang NAMANYA
//     sama (snapshot `demo_seed.json`); kalau tidak ada yang sama, dipinjam dari
//     produk lama yang paling mirip namanya; kalau tetap tidak ada, kategori
//     pertama + harga median.
//
// Snapshot lama TIDAK diubah — tombol "Isi Data Demo" selalu bisa memulihkannya.
// ID produk hasil fetch dicatat di landing_content (key `scmSeedMarker`) supaya
// "Hapus Data Fetch" hanya menghapus produk hasil fetch.
// ---------------------------------------------------------------------------

const MARKER_KEY = 'scmSeedMarker';

interface ScmProduct {
  id?: string | number;
  name?: string;
  satuanHasil?: string | null;
  deskripsi?: string | null;
  fotoUrl?: string | null;
  isActive?: boolean | number | null;
}

interface Marker {
  ids: number[];
  files: string[];
}

type Row = Record<string, unknown>;
const OLD_PRODUCTS = (seedData as unknown as { products: Row[] }).products;
const OLD_IMAGES = (seedData as unknown as { product_images: Row[] }).product_images;

const norm = (s: unknown) =>
  String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const slugify = (s: string) =>
  norm(s).replace(/ /g, '-').slice(0, 180) || 'produk';

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(' ').filter((w) => w.length > 2));
}

function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let hit = 0;
  ta.forEach((w) => { if (tb.has(w)) hit++; });
  return hit / Math.max(ta.size, tb.size);
}

// ---- Fetch dari SCM --------------------------------------------------------

async function fetchScmProducts(): Promise<ScmProduct[]> {
  const { apiKey, apiUrl } = config.scm;
  if (!apiKey) {
    throw new AppError('API key SCM belum diatur. Isi ECATALOG_BESTARI_SCM_API_KEY di backend/.env lalu restart backend.', 400);
  }

  const all: ScmProduct[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    let res: Response;
    try {
      res = await fetch(`${apiUrl}/products?limit=100&page=${page}`, {
        headers: { 'x-api-key': apiKey, Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new AppError('Tidak bisa terhubung ke API SCM.', 502);
    }
    if (res.status === 401 || res.status === 403) {
      throw new AppError('API key SCM ditolak. Periksa ECATALOG_BESTARI_SCM_API_KEY.', 502);
    }
    if (!res.ok) throw new AppError(`API SCM membalas error (HTTP ${res.status}).`, 502);

    const body = (await res.json().catch(() => null)) as { data?: unknown } | null;
    const list = Array.isArray(body?.data) ? (body!.data as ScmProduct[]) : [];
    // Jika API mengabaikan `page`, data yang sama berulang → berhenti.
    const fresh = list.filter((p) => !seen.has(String(p.id ?? p.name)));
    fresh.forEach((p) => seen.add(String(p.id ?? p.name)));
    all.push(...fresh);
    if (list.length < 100 || fresh.length === 0) break;
  }
  return all;
}

// ---- Gambar ----------------------------------------------------------------

// Kembalikan URL gambar untuk disimpan; data URL base64 ditulis ke folder upload.
function resolveImage(fotoUrl: string | null | undefined, written: string[]): string | null {
  if (!fotoUrl) return null;
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(fotoUrl);
  if (m) {
    const ext = m[1].toLowerCase().replace('jpeg', 'jpg');
    const name = `scm_${crypto.randomBytes(12).toString('hex')}.${ext}`;
    fs.mkdirSync(config.upload.dir, { recursive: true });
    fs.writeFileSync(path.join(config.upload.dir, name), Buffer.from(m[2], 'base64'));
    written.push(name);
    return `/uploads/${name}`;
  }
  if (/^https?:\/\//i.test(fotoUrl)) return fotoUrl;
  if (fotoUrl.startsWith('/')) return `${new URL(config.scm.apiUrl).origin}${fotoUrl}`;
  return null;
}

// ---- Marker ----------------------------------------------------------------

async function readMarker(): Promise<Marker> {
  const [rows] = await dbPool.query('SELECT `value` FROM landing_content WHERE `key` = ?', [MARKER_KEY]);
  const raw = (rows as Array<{ value: string }>)[0]?.value;
  try {
    const parsed = JSON.parse(raw || '');
    return { ids: Array.isArray(parsed.ids) ? parsed.ids : [], files: Array.isArray(parsed.files) ? parsed.files : [] };
  } catch {
    return { ids: [], files: [] };
  }
}

// ---- Status ----------------------------------------------------------------

export async function getScmSeedStatus() {
  const marker = await readMarker();
  const [rows] = await dbPool.query('SELECT COUNT(*) AS total FROM products');
  return {
    keyConfigured: Boolean(config.scm.apiKey),
    fetchedCount: marker.ids.length,
    productCount: Number((rows as Array<{ total: number }>)[0]?.total || 0),
  };
}

// ---- Create ----------------------------------------------------------------

export async function applyScmSeed(): Promise<{ created: number; matched: number; fallback: number }> {
  const scm = (await fetchScmProducts()).filter((p) => p.name && String(p.name).trim());
  if (scm.length === 0) throw new AppError('API SCM tidak mengembalikan produk.', 502);

  const [catRows] = await dbPool.query('SELECT id FROM categories ORDER BY id ASC');
  const categoryIds = (catRows as Array<{ id: number }>).map((c) => Number(c.id));
  if (categoryIds.length === 0) {
    throw new AppError('Belum ada kategori. Tekan "Isi Data Demo" dulu agar kategori tersedia.', 400);
  }

  const prices = OLD_PRODUCTS.map((p) => Number(p.price) || 0).filter((n) => n > 0).sort((a, b) => a - b);
  const medianPrice = prices.length ? prices[Math.floor(prices.length / 2)] : 10000;

  const cols = await getColumns('products');
  const written: string[] = [];
  const conn = await dbPool.getConnection();
  const usedSlugs = new Set<string>();
  let matched = 0;
  let fallback = 0;
  try {
    await conn.beginTransaction();
    for (const table of ['product_images', 'article_products', 'products']) {
      await conn.query(`DELETE FROM \`${table}\``);
    }

    const ids: number[] = [];
    for (const p of scm) {
      const name = String(p.name).trim();

      // Cocokkan dgn produk lama: nama sama persis → kalau tidak, paling mirip.
      let old = OLD_PRODUCTS.find((o) => norm(o.name) === norm(name));
      if (old) {
        matched++;
      } else {
        let best = 0;
        for (const o of OLD_PRODUCTS) {
          const s = similarity(name, String(o.name));
          if (s > best) { best = s; old = o; }
        }
        if (best < 0.5) old = undefined;
        fallback++;
      }

      let slug = slugify(name);
      for (let i = 2; usedSlugs.has(slug); i++) slug = `${slugify(name)}-${i}`;
      usedSlugs.add(slug);

      const oldCat = old ? Number(old.category_id) : NaN;
      const row: Row = {
        ...(old || {}),
        category_id: categoryIds.includes(oldCat) ? oldCat : categoryIds[0],
        name,
        slug,
        description: p.deskripsi ?? (old?.description as string | undefined) ?? null,
        price: old ? Number(old.price) || medianPrice : medianPrice,
        is_active: p.isActive === false || p.isActive === 0 ? 0 : 1,
        is_featured: 0,
        rating_avg: 0,
        review_count: 0,
        sales_count: 0,
      };
      delete row.id;
      delete row.created_at;
      delete row.updated_at;

      const keys = Object.keys(row).filter((k) => cols.has(k));
      const [ins] = await conn.query(
        `INSERT INTO products (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
        keys.map((k) => row[k] ?? null),
      );
      const productId = Number((ins as { insertId: number }).insertId);
      ids.push(productId);

      // Foto: SCM dulu; kalau kosong pakai foto produk lama yang cocok.
      const scmImage = resolveImage(p.fotoUrl, written);
      const images = scmImage
        ? [scmImage]
        : old
          ? OLD_IMAGES.filter((i) => String(i.product_id) === String(old!.id)).map((i) => String(i.image_url))
          : [];
      for (let i = 0; i < images.length; i++) {
        await conn.query(
          'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
          [productId, images[i], name, i === 0 ? 1 : 0, i],
        );
      }
    }
    await conn.commit();

    const activeIds = ids.slice(0, 5).map(String);
    await upsertLandingContent({
      [MARKER_KEY]: JSON.stringify({ ids, files: written } satisfies Marker),
      featuredProductIds: JSON.stringify(activeIds),
    }).catch(() => 0);

    return { created: ids.length, matched, fallback };
  } catch (e) {
    await conn.rollback();
    written.forEach((f) => fs.rmSync(path.join(config.upload.dir, f), { force: true }));
    throw e;
  } finally {
    conn.release();
  }
}

// ---- Delete ----------------------------------------------------------------

export async function clearScmSeed(): Promise<{ removed: number }> {
  const marker = await readMarker();
  let removed = 0;
  if (marker.ids.length > 0) {
    const [r] = await dbPool.query('DELETE FROM products WHERE id IN (?)', [marker.ids]);
    removed = (r as { affectedRows: number }).affectedRows;
    await dbPool.query('DELETE FROM article_products WHERE product_id IN (?)', [marker.ids]).catch(() => 0);
  }
  marker.files.forEach((f) => fs.rmSync(path.join(config.upload.dir, path.basename(f)), { force: true }));
  await upsertLandingContent({ [MARKER_KEY]: '', featuredProductIds: '[]' }).catch(() => 0);
  return { removed };
}

async function getColumns(table: string): Promise<Set<string>> {
  const [rows] = await dbPool.query(
    'SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?',
    [table],
  );
  return new Set((rows as Array<{ COLUMN_NAME: string }>).map((r) => r.COLUMN_NAME));
}
