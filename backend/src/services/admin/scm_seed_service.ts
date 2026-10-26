import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dbPool from '../../lib/db';
import { config } from '../../lib/config';
import { AppError } from '../../lib/errors_utils';
import seedData from '../../data/catalog_reference.json';
import { upsertLandingContent } from '../landing_content_service';

// ---------------------------------------------------------------------------
// SCM Seeder — ambil produk olahan dari API SCM, ubah ke format produk toko.
//
// SCM hanya punya: id, name, satuanHasil, deskripsi, fotoUrl, isActive.
// Tidak ada harga / kategori / berat. Karena itu:
//   - nama, deskripsi, status aktif, foto  → dari SCM
//   - harga, kategori, berat, komposisi, dst → dari produk lama yang NAMANYA
//     sama (`data/catalog_reference.json`); kalau tidak ada yang sama, dipinjam dari
//     produk lama yang paling mirip namanya; kalau tetap tidak ada, kategori
//     pertama + harga median.
//
// ID produk hasil fetch dicatat di landing_content (key `scmSeedMarker`) supaya
// "Hapus Data Fetch" hanya menghapus produk hasil fetch.
//
// Fetch otomatis (`autoFetchScm`, tiap ECATALOG_BESTARI_SCM_FETCH_SECONDS detik,
// default 60) HANYA jalan selama mode SCM aktif (sudah "Fetch dari SCM"). Setelah
// "Hapus Data Fetch" toko dibiarkan kosong sampai admin Fetch lagi. Fetch ulang
// hanya terjadi kalau data SCM berubah (dibandingkan lewat hash).
//
// Fetch ulang TIDAK menimpa editan admin: produk yang sudah ada (dicocokkan lewat
// id SCM) hanya diperbarui pada kolom yang nilainya BERUBAH di SCM sejak fetch
// sebelumnya (snapshot `snap` di marker). Deskripsi, harga, nomor WA, info
// pengiriman, dst. yang diisi admin tetap. Produk baru di SCM ditambahkan; produk
// yang hilang dari SCM dihapus. Hanya fetch pertama (marker kosong) yang
// mengganti seluruh produk toko.
//
// QR: SCM menaruh QR di kemasan (QR umum produk, `/packaging`) dan di batch
// olahan (1 batch = 1 QR, `/production`), keduanya terhubung lewat `productId`.
// Saat fetch, QR terbaru tiap produk dicatat di marker (`qr`, key = id produk
// toko) dan ditampilkan kecil di deskripsi produk.
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

// Nilai SCM per produk saat fetch terakhir — pembanding untuk fetch berikutnya.
interface ScmSnap {
  name: string;
  unit: string | null;
  desc: string | null;
  foto: string | null; // sha1 fotoUrl (data URL bisa besar)
  active: number;
}

interface Marker {
  ids: number[];
  files: string[];
  map?: Record<string, number>;     // id SCM → id produk toko
  snap?: Record<string, ScmSnap>;   // id SCM → nilai SCM saat fetch terakhir
  hash?: string;                    // hash data SCM saat fetch terakhir
  qr?: Record<string, ScmQr>;        // id produk toko → QR dari SCM
}

export interface ScmQr {
  qrUrl: string;          // gambar QR (PNG)
  publicUrl: string | null; // halaman yang dibuka saat QR dipindai
  label: string | null;   // kode kemasan / batch
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
  return fetchScmList<ScmProduct>('products', (p) => String(p.id ?? p.name));
}

async function fetchScmList<T>(resource: string, idOf: (item: T) => string): Promise<T[]> {
  const { apiKey, apiUrl } = config.scm;
  if (!apiKey) {
    throw new AppError('API key SCM belum diatur. Isi ECATALOG_BESTARI_SCM_API_KEY di backend/.env lalu restart backend.', 400);
  }

  const all: T[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    let res: Response;
    try {
      res = await fetch(`${apiUrl}/${resource}?limit=100&page=${page}`, {
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
    const list = Array.isArray(body?.data) ? (body!.data as T[]) : [];
    // Jika API mengabaikan `page`, data yang sama berulang → berhenti.
    const fresh = list.filter((p) => !seen.has(idOf(p)));
    fresh.forEach((p) => seen.add(idOf(p)));
    all.push(...fresh);
    if (list.length < 100 || fresh.length === 0) break;
  }
  return all;
}

// ---- QR ------------------------------------------------------------------

interface ScmQrSource {
  id?: string | number;
  productId?: string | number | null;
  kodeKemasan?: string;
  kodeBatch?: string;
  tanggalProduksi?: string | null;
  statusQC?: string | null;
  createdAt?: string | null;
  publicUrl?: string | null;
  qrUrl?: string | null;
}

// id produk SCM → QR. Kemasan (QR umum produk) diutamakan; kalau produk belum
// punya kemasan, pakai batch olahan terbaru (yang lolos QC lebih dulu).
// Return null kalau SCM gagal dihubungi → QR lama dipertahankan.
async function fetchScmQr(): Promise<Record<string, ScmQr> | null> {
  try {
    const idOf = (x: ScmQrSource) => String(x.id ?? x.kodeKemasan ?? x.kodeBatch);
    const [packs, batches] = await Promise.all([
      fetchScmList<ScmQrSource>('packaging', idOf),
      fetchScmList<ScmQrSource>('production', idOf),
    ]);
    const newest = (a: ScmQrSource, b: ScmQrSource) =>
      String(b.tanggalProduksi || b.createdAt || '').localeCompare(String(a.tanggalProduksi || a.createdAt || ''));
    const out: Record<string, ScmQr> = {};
    const add = (list: ScmQrSource[], label: (x: ScmQrSource) => string | undefined) => {
      for (const x of list) {
        const pid = x.productId == null ? '' : String(x.productId);
        if (!pid || out[pid] || !x.qrUrl) continue;
        out[pid] = { qrUrl: String(x.qrUrl), publicUrl: x.publicUrl ? String(x.publicUrl) : null, label: label(x) || null };
      }
    };
    add([...packs].sort(newest), (x) => x.kodeKemasan);
    const passed = (x: ScmQrSource) => (x.statusQC === 'Lolos QC' ? 0 : 1);
    add([...batches].sort((a, b) => passed(a) - passed(b) || newest(a, b)), (x) => x.kodeBatch);
    return out;
  } catch (e) {
    console.error('[SCM Sync] QR gagal diambil:', (e as Error).message);
    return null;
  }
}

// key: id SCM → id produk toko.
function qrByShopId(byScmId: Record<string, ScmQr>, map: Record<string, number>): Record<string, ScmQr> {
  const out: Record<string, ScmQr> = {};
  Object.entries(map).forEach(([scmId, pid]) => { if (byScmId[scmId]) out[String(pid)] = byScmId[scmId]; });
  return out;
}

let qrCache: { at: number; qr: Record<string, ScmQr> } | null = null;

// QR SCM untuk satu produk toko (dibaca dari marker, cache singkat).
export async function getScmQr(productId: number): Promise<ScmQr | null> {
  if (!qrCache || Date.now() - qrCache.at > 5_000) {
    qrCache = { at: Date.now(), qr: (await readMarker().catch(() => null))?.qr || {} };
  }
  return qrCache.qr[String(productId)] || null;
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
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
      files: Array.isArray(parsed.files) ? parsed.files : [],
      map: parsed.map && typeof parsed.map === 'object' ? parsed.map : undefined,
      qr: parsed.qr && typeof parsed.qr === 'object' ? parsed.qr : undefined,
      snap: parsed.snap && typeof parsed.snap === 'object' ? parsed.snap : undefined,
      hash: typeof parsed.hash === 'string' ? parsed.hash : undefined,
    };
  } catch {
    return { ids: [], files: [] };
  }
}

const scmKey = (p: ScmProduct) => String(p.id ?? norm(p.name));
const unitOf = (p: ScmProduct) => (p.satuanHasil ? String(p.satuanHasil).trim() || null : null);
const activeOf = (p: ScmProduct) => (p.isActive === false || p.isActive === 0 ? 0 : 1);
// Deskripsi SCM sering string kosong → dianggap tidak ada (pakai cadangan katalog).
const descOf = (p: ScmProduct) => (p.deskripsi ? String(p.deskripsi).trim() || null : null);
const sha1 = (v: string) => crypto.createHash('sha1').update(v).digest('hex');
const snapOf = (p: ScmProduct): ScmSnap => ({
  name: String(p.name).trim(),
  unit: unitOf(p),
  desc: descOf(p),
  foto: p.fotoUrl ? sha1(String(p.fotoUrl)) : null,
  active: activeOf(p),
});

// ---- Status ----------------------------------------------------------------

let lastFetchAt: string | null = null;

export async function getScmSeedStatus() {
  const marker = await readMarker();
  const [rows] = await dbPool.query('SELECT COUNT(*) AS total FROM products');
  return {
    keyConfigured: Boolean(config.scm.apiKey),
    fetchSeconds: config.scm.fetchSeconds,
    lastFetchAt,
    fetchedCount: marker.ids.length,
    productCount: Number((rows as Array<{ total: number }>)[0]?.total || 0),
  };
}

// ---- Create ----------------------------------------------------------------

type Conn = Awaited<ReturnType<typeof dbPool.getConnection>>;

interface InsertCtx {
  categoryIds: number[];
  medianPrice: number;
  cols: Set<string>;
  usedSlugs: Set<string>;
  written: string[];
}

async function loadInsertCtx(conn: Conn, written: string[]): Promise<InsertCtx> {
  let [catRows] = await conn.query('SELECT id FROM categories ORDER BY id ASC');
  if ((catRows as unknown[]).length === 0) {
    // Seeder SCM berdiri sendiri: kategori kosong → isi kategori standar dari snapshot.
    const cats = (seedData as unknown as { categories: Row[] }).categories;
    for (const c of cats) {
      await conn.query(
        'INSERT INTO categories (id, name, slug, image_url, sort_order) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.name, c.slug, c.image_url ?? null, c.sort_order ?? 0],
      );
    }
    [catRows] = await conn.query('SELECT id FROM categories ORDER BY id ASC');
  }
  const categoryIds = (catRows as Array<{ id: number }>).map((c) => Number(c.id));
  const prices = OLD_PRODUCTS.map((p) => Number(p.price) || 0).filter((n) => n > 0).sort((a, b) => a - b);
  const [slugRows] = await conn.query('SELECT slug FROM products');
  return {
    categoryIds,
    medianPrice: prices.length ? prices[Math.floor(prices.length / 2)] : 10000,
    cols: await getColumns('products'),
    usedSlugs: new Set((slugRows as Array<{ slug: string }>).map((r) => r.slug)),
    written,
  };
}

function uniqueSlug(name: string, used: Set<string>): string {
  let slug = slugify(name);
  for (let i = 2; used.has(slug); i++) slug = `${slugify(name)}-${i}`;
  used.add(slug);
  return slug;
}

// Tambah satu produk SCM baru ke toko. Return id produk & apakah namanya sama persis dgn produk lama.
async function insertScmProduct(
  conn: Conn, p: ScmProduct, ctx: InsertCtx,
): Promise<{ productId: number; exact: boolean }> {
  const name = String(p.name).trim();

  // Cocokkan dgn produk lama: nama sama persis → kalau tidak, paling mirip.
  let old = OLD_PRODUCTS.find((o) => norm(o.name) === norm(name));
  const exact = Boolean(old);
  if (!old) {
    let best = 0;
    for (const o of OLD_PRODUCTS) {
      const s = similarity(name, String(o.name));
      if (s > best) { best = s; old = o; }
    }
    if (best < 0.5) old = undefined;
  }

  const oldCat = old ? Number(old.category_id) : NaN;
  const row: Row = {
    ...(old || {}),
    category_id: ctx.categoryIds.includes(oldCat) ? oldCat : ctx.categoryIds[0],
    name,
    slug: uniqueSlug(name, ctx.usedSlugs),
    description: descOf(p) ?? (old?.description as string | undefined) ?? null,
    weight_spec: unitOf(p) ?? (old?.weight_spec as string | undefined) ?? null,
    price: old ? Number(old.price) || ctx.medianPrice : ctx.medianPrice,
    is_active: activeOf(p),
    is_featured: 0,
    rating_avg: 0,
    review_count: 0,
    sales_count: 0,
  };
  delete row.id;
  delete row.created_at;
  delete row.updated_at;

  const keys = Object.keys(row).filter((k) => ctx.cols.has(k));
  const [ins] = await conn.query(
    `INSERT INTO products (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    keys.map((k) => row[k] ?? null),
  );
  const productId = Number((ins as { insertId: number }).insertId);

  // Foto: SCM dulu; kalau kosong pakai foto produk lama yang cocok.
  const scmImage = resolveImage(p.fotoUrl, ctx.written);
  const images = scmImage
    ? [scmImage]
    : old
      ? OLD_IMAGES.filter((i) => String(i.product_id) === String(old!.id)).map((i) => String(i.image_url))
      : [];
  await insertImages(conn, productId, images, name);
  return { productId, exact };
}

async function insertImages(conn: Conn, productId: number, images: string[], alt: string) {
  for (let i = 0; i < images.length; i++) {
    await conn.query(
      'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
      [productId, images[i], alt, i === 0 ? 1 : 0, i],
    );
  }
}

async function imageUrlsOf(conn: Conn, productIds: number[]): Promise<string[]> {
  if (productIds.length === 0) return [];
  const [rows] = await conn.query('SELECT image_url FROM product_images WHERE product_id IN (?)', [productIds]);
  return (rows as Array<{ image_url: string }>).map((r) => String(r.image_url));
}

// Perbarui produk hasil fetch yang sudah ada: hanya kolom yang nilainya berubah
// di SCM sejak fetch terakhir. Tanpa snapshot lama (marker versi lama) → tidak ada
// yang diubah, supaya editan admin aman. URL gambar yang diganti masuk `dropped`.
async function updateScmProduct(
  conn: Conn, productId: number, p: ScmProduct, now: ScmSnap, before: ScmSnap | undefined,
  ctx: InsertCtx, dropped: string[],
): Promise<boolean> {
  if (!before) return false;
  const set: Row = {};
  if (now.name !== before.name) set.name = now.name;
  if (now.unit !== before.unit && now.unit) set.weight_spec = now.unit;
  if (now.desc !== before.desc && now.desc) set.description = now.desc;
  if (now.active !== before.active) set.is_active = now.active;
  const keys = Object.keys(set).filter((k) => ctx.cols.has(k));
  if (keys.length) {
    await conn.query(
      `UPDATE products SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
      [...keys.map((k) => set[k]), productId],
    );
  }
  let fotoChanged = false;
  if (now.foto !== before.foto && now.foto) {
    const img = resolveImage(p.fotoUrl, ctx.written);
    if (img) {
      dropped.push(...(await imageUrlsOf(conn, [productId])));
      await conn.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      await insertImages(conn, productId, [img], now.name);
      fotoChanged = true;
    }
  }
  return keys.length > 0 || fotoChanged;
}

async function fetchScmNamed(): Promise<ScmProduct[]> {
  const scm = (await fetchScmProducts()).filter((p) => p.name && String(p.name).trim());
  if (scm.length === 0) throw new AppError('API SCM tidak mengembalikan produk.', 502);
  return scm;
}

// Fetch, fetch otomatis & hapus dijalankan bergantian (antrean), jadi hapus yang
// ditekan saat fetch otomatis berjalan tetap terjadi SETELAHNYA — data tidak muncul lagi.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => 0);
  return run;
}

const scmHash = (scm: ScmProduct[], qr: Record<string, ScmQr> | null) =>
  crypto.createHash('sha1').update(JSON.stringify([scm, qr])).digest('hex');

export function applyScmSeed() {
  return exclusive(async () => {
    const scm = await fetchScmNamed();
    return doApplyScmSeed(scm, await fetchScmQr());
  });
}

// Fetch otomatis: hanya di mode SCM & hanya kalau data SCM berubah.
// Return true kalau produk toko diganti.
export function autoFetchScm(): Promise<boolean> {
  return exclusive(async () => {
    const marker = await readMarker();
    if (marker.ids.length === 0) return false; // sudah dihapus / belum pernah fetch
    const scm = await fetchScmNamed();
    const scmQr = await fetchScmQr();
    lastFetchAt = new Date().toISOString();
    // QR gagal diambil → lewati putaran ini (coba lagi berikutnya) agar QR tidak hilang.
    if (!scmQr || marker.hash === scmHash(scm, scmQr)) return false;
    await doApplyScmSeed(scm, scmQr);
    return true;
  });
}

async function doApplyScmSeed(
  scm: ScmProduct[], scmQr: Record<string, ScmQr> | null,
): Promise<{ created: number; updated: number; removed: number; matched: number; fallback: number }> {
  const written: string[] = [];
  const dropped: string[] = []; // URL gambar yang tidak dipakai lagi
  const prev = await readMarker();
  const conn = await dbPool.getConnection();
  let matched = 0;
  let created = 0;
  let updated = 0;
  try {
    await conn.beginTransaction();

    // Produk hasil fetch sebelumnya yang masih ada di toko.
    let existing = new Set<number>();
    if (prev.ids.length > 0) {
      const [rows] = await conn.query('SELECT id FROM products WHERE id IN (?)', [prev.ids]);
      existing = new Set((rows as Array<{ id: number }>).map((r) => Number(r.id)));
    }
    // Fetch pertama (atau setelah "Hapus Data Fetch"): ganti seluruh produk toko.
    const fresh = existing.size === 0;
    if (fresh) {
      for (const table of ['product_images', 'article_products', 'products']) {
        await conn.query(`DELETE FROM \`${table}\``);
      }
    }
    const ctx = await loadInsertCtx(conn, written);

    const ids: number[] = [];
    const map: Record<string, number> = {};
    const snap: Record<string, ScmSnap> = {};
    for (const p of scm) {
      const key = scmKey(p);
      const now = snapOf(p);
      snap[key] = now;
      const pid = prev.map?.[key];
      if (!fresh && pid && existing.has(pid)) {
        if (await updateScmProduct(conn, pid, p, now, prev.snap?.[key], ctx, dropped)) updated++;
        existing.delete(pid);
        ids.push(pid);
        map[key] = pid;
        continue;
      }
      const { productId, exact } = await insertScmProduct(conn, p, ctx);
      if (exact) matched++;
      created++;
      ids.push(productId);
      map[key] = productId;
    }

    // Sisa `existing` = produk hasil fetch yang sudah tidak ada di SCM → hapus.
    const gone = fresh ? [] : [...existing];
    if (gone.length) {
      dropped.push(...(await imageUrlsOf(conn, gone)));
      await conn.query('DELETE FROM article_products WHERE product_id IN (?)', [gone]);
      await conn.query('DELETE FROM product_images WHERE product_id IN (?)', [gone]);
      await conn.query('DELETE FROM products WHERE id IN (?)', [gone]);
    }
    await conn.commit();

    // File gambar hasil fetch yang tidak dipakai lagi dihapus dari disk.
    const droppedNames = new Set(dropped.map((u) => path.basename(u)));
    const stale = fresh ? prev.files : prev.files.filter((f) => droppedNames.has(path.basename(f)));
    stale.forEach((f) => fs.rmSync(path.join(config.upload.dir, path.basename(f)), { force: true }));
    const files = [...prev.files.filter((f) => !fresh && !droppedNames.has(path.basename(f))), ...written];

    await upsertLandingContent({
      [MARKER_KEY]: JSON.stringify({ ids, files, map, snap, qr: qrByShopId(scmQr || {}, map), hash: scmHash(scm, scmQr) } satisfies Marker),
      // Produk pilihan beranda hanya diisi ulang saat toko diganti total.
      ...(fresh ? { featuredProductIds: JSON.stringify(ids.slice(0, 5).map(String)) } : {}),
    }).catch(() => 0);
    qrCache = null;

    lastFetchAt = new Date().toISOString();
    return { created, updated, removed: gone.length, matched, fallback: created - matched };
  } catch (e) {
    await conn.rollback();
    written.forEach((f) => fs.rmSync(path.join(config.upload.dir, f), { force: true }));
    throw e;
  } finally {
    conn.release();
  }
}

// ---- Delete ----------------------------------------------------------------

export function clearScmSeed() {
  return exclusive(doClearScmSeed);
}

async function doClearScmSeed(): Promise<{ removed: number }> {
  const marker = await readMarker();
  let removed = 0;
  if (marker.ids.length > 0) {
    const [r] = await dbPool.query('DELETE FROM products WHERE id IN (?)', [marker.ids]);
    removed = (r as { affectedRows: number }).affectedRows;
    await dbPool.query('DELETE FROM article_products WHERE product_id IN (?)', [marker.ids]).catch(() => 0);
  }
  marker.files.forEach((f) => fs.rmSync(path.join(config.upload.dir, path.basename(f)), { force: true }));
  await upsertLandingContent({ [MARKER_KEY]: '', featuredProductIds: '[]' }).catch(() => 0);
  qrCache = null;
  return { removed };
}

async function getColumns(table: string): Promise<Set<string>> {
  const [rows] = await dbPool.query(
    'SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?',
    [table],
  );
  return new Set((rows as Array<{ COLUMN_NAME: string }>).map((r) => r.COLUMN_NAME));
}
