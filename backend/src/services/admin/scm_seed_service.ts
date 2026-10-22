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
// Sinkron (`syncScm`): setelah fetch, perubahan di SCM (nama, deskripsi, satuan,
// status aktif, foto) diterapkan ke produk yang sama TANPA menghapus — harga &
// kategori yang sudah diatur admin tetap. Produk baru di SCM ditambahkan, produk
// yang hilang dari SCM dinonaktifkan. Dijalankan otomatis tiap
// ECATALOG_BESTARI_SCM_SYNC_SECONDS detik, saat daftar produk diminta, dan lewat tombol "Sinkronkan".
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
  map?: Record<string, number>;     // id SCM → id produk toko
  photos?: Record<string, string>;  // id SCM → hash fotoUrl terakhir
  scmActive?: Record<string, number>; // id SCM → status aktif terakhir di SCM
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
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
      files: Array.isArray(parsed.files) ? parsed.files : [],
      map: parsed.map && typeof parsed.map === 'object' ? parsed.map : undefined,
      photos: parsed.photos && typeof parsed.photos === 'object' ? parsed.photos : undefined,
      scmActive: parsed.scmActive && typeof parsed.scmActive === 'object' ? parsed.scmActive : undefined,
    };
  } catch {
    return { ids: [], files: [] };
  }
}

const scmKey = (p: ScmProduct) => String(p.id ?? norm(p.name));
const photoHash = (u: string | null | undefined) =>
  u ? crypto.createHash('sha1').update(u).digest('hex') : '';
const unitOf = (p: ScmProduct) => (p.satuanHasil ? String(p.satuanHasil).trim() || null : null);
const activeOf = (p: ScmProduct) => (p.isActive === false || p.isActive === 0 ? 0 : 1);

// ---- Status ----------------------------------------------------------------

let lastSyncAt: string | null = null;

export async function getScmSeedStatus() {
  const marker = await readMarker();
  const [rows] = await dbPool.query('SELECT COUNT(*) AS total FROM products');
  return {
    keyConfigured: Boolean(config.scm.apiKey),
    syncSeconds: config.scm.syncSeconds,
    lastSyncAt,
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
  conn: Conn, p: ScmProduct, ctx: InsertCtx, draft = false,
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
    description: p.deskripsi ?? (old?.description as string | undefined) ?? null,
    weight_spec: unitOf(p) ?? (old?.weight_spec as string | undefined) ?? null,
    price: old ? Number(old.price) || ctx.medianPrice : ctx.medianPrice,
    is_active: draft ? 0 : activeOf(p),
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
  for (let i = 0; i < images.length; i++) {
    await conn.query(
      'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
      [productId, images[i], name, i === 0 ? 1 : 0, i],
    );
  }
  return { productId, exact };
}

async function fetchScmNamed(): Promise<ScmProduct[]> {
  const scm = (await fetchScmProducts()).filter((p) => p.name && String(p.name).trim());
  if (scm.length === 0) throw new AppError('API SCM tidak mengembalikan produk.', 502);
  return scm;
}

export async function applyScmSeed(): Promise<{ created: number; matched: number; fallback: number }> {
  const scm = await fetchScmNamed();
  const written: string[] = [];
  const conn = await dbPool.getConnection();
  let matched = 0;
  try {
    await conn.beginTransaction();
    for (const table of ['product_images', 'article_products', 'products']) {
      await conn.query(`DELETE FROM \`${table}\``);
    }
    const ctx = await loadInsertCtx(conn, written);

    const ids: number[] = [];
    const map: Record<string, number> = {};
    const photos: Record<string, string> = {};
    const scmActive: Record<string, number> = {};
    for (const p of scm) {
      scmActive[scmKey(p)] = activeOf(p);
      const { productId, exact } = await insertScmProduct(conn, p, ctx);
      if (exact) matched++;
      ids.push(productId);
      map[scmKey(p)] = productId;
      photos[scmKey(p)] = photoHash(p.fotoUrl);
    }
    await conn.commit();

    // File gambar lama dari fetch sebelumnya sudah tidak dipakai.
    const prev = await readMarker();
    prev.files.forEach((f) => fs.rmSync(path.join(config.upload.dir, path.basename(f)), { force: true }));

    await upsertLandingContent({
      [MARKER_KEY]: JSON.stringify({ ids, files: written, map, photos, scmActive } satisfies Marker),
      featuredProductIds: JSON.stringify(ids.slice(0, 5).map(String)),
    }).catch(() => 0);

    lastSyncAt = new Date().toISOString();
    return { created: ids.length, matched, fallback: ids.length - matched };
  } catch (e) {
    await conn.rollback();
    written.forEach((f) => fs.rmSync(path.join(config.upload.dir, f), { force: true }));
    throw e;
  } finally {
    conn.release();
  }
}

// ---- Sync ------------------------------------------------------------------
//
// Dipanggil otomatis (interval) dan setiap admin membuka Kelola Produk —
// hanya di mode SCM (sudah "Fetch dari SCM", belum dihapus lewat "Hapus Data Fetch").
//  - Produk SCM yang sudah tertaut → nama, deskripsi, satuan, foto ikut SCM.
//    Harga, kategori & status publish TIDAK disentuh (milik admin).
//  - Produk SCM yang belum ada di toko → ditautkan ke produk bernama sama,
//    kalau tidak ada → ditambahkan sebagai DRAFT (is_active = 0). Admin yang
//    mem-publish lewat Edit Produk.
//  - Produk dinonaktifkan / dihapus di SCM → dinonaktifkan di toko (sekali, saat
//    berubah — kalau admin publish ulang, tidak ditimpa lagi).

export interface SyncResult {
  active: boolean;   // false = mode SCM tidak aktif (belum fetch / sudah dihapus) atau sinkron lain sedang jalan
  updated: number;
  created: number;
  deactivated: number;
}

let syncing = false;

export async function syncScm(): Promise<SyncResult> {
  const result: SyncResult = { active: false, updated: 0, created: 0, deactivated: 0 };
  if (syncing) return result;
  syncing = true;
  result.active = true;

  const written: string[] = [];
  const obsoleteFiles: string[] = [];
  let conn: Conn | null = null;
  try {
    // Sinkron HANYA berjalan di "mode SCM" (setelah "Fetch dari SCM"). Setelah
    // "Hapus Data Fetch", produk SCM tidak ditarik lagi sampai fetch ulang.
    const marker = await readMarker();
    if (marker.ids.length === 0) { result.active = false; return result; }
    const scm = await fetchScmNamed();
    conn = await dbPool.getConnection();

    const [rows] = await conn.query('SELECT id, name, slug, description, weight_spec, is_active FROM products');
    const existing = new Map((rows as Row[]).map((r) => [Number(r.id), r]));
    const map: Record<string, number> = {};
    Object.entries(marker.map || {}).forEach(([k, id]) => { if (existing.has(Number(id))) map[k] = Number(id); });
    const photos: Record<string, string> = { ...(marker.photos || {}) };
    const scmActive: Record<string, number> = { ...(marker.scmActive || {}) };

    const linked = () => new Set(Object.values(map));
    // Tautkan produk SCM yang belum punya pasangan → produk toko bernama sama.
    for (const p of scm) {
      if (map[scmKey(p)] !== undefined) continue;
      const used = linked();
      const hit = [...existing.values()].find((r) => !used.has(Number(r.id)) && norm(r.name) === norm(p.name));
      if (hit) { map[scmKey(p)] = Number(hit.id); delete photos[scmKey(p)]; }
    }
    // Marker lama (sebelum ada pemetaan id SCM): pasangkan sisanya lewat kemiripan nama.
    if (!marker.map) {
      for (const p of scm) {
        if (map[scmKey(p)] !== undefined) continue;
        const used = linked();
        let best = 0;
        let hit: number | undefined;
        marker.ids.forEach((id) => {
          const r = existing.get(id);
          if (!r || used.has(id)) return;
          const sim = similarity(String(p.name), String(r.name));
          if (sim > best) { best = sim; hit = id; }
        });
        if (hit !== undefined && best >= 0.5) map[scmKey(p)] = hit;
      }
    }

    await conn.beginTransaction();
    const ctx = await loadInsertCtx(conn, written);

    for (const p of scm) {
      const key = scmKey(p);
      const row = existing.get(map[key]);
      const nowActive = activeOf(p);
      const wasActive = scmActive[key];
      scmActive[key] = nowActive;

      if (!row) {
        const { productId } = await insertScmProduct(conn, p, ctx, true);
        map[key] = productId;
        photos[key] = photoHash(p.fotoUrl);
        result.created++;
        continue;
      }

      const pid = Number(row.id);
      const name = String(p.name).trim();
      const changes: Row = {};
      if (row.name !== name) {
        changes.name = name;
        ctx.usedSlugs.delete(String(row.slug));
        changes.slug = uniqueSlug(name, ctx.usedSlugs);
      }
      if (p.deskripsi != null && row.description !== p.deskripsi) changes.description = p.deskripsi;
      const unit = unitOf(p);
      if (unit && row.weight_spec !== unit) changes.weight_spec = unit;
      // Baru dinonaktifkan di SCM → sembunyikan dari toko.
      if (nowActive === 0 && wasActive !== 0 && Number(row.is_active) === 1) {
        changes.is_active = 0;
        result.deactivated++;
      }

      const hash = photoHash(p.fotoUrl);
      const photoChanged = Boolean(p.fotoUrl) && photos[key] !== hash;

      const keys = Object.keys(changes);
      if (keys.length > 0) {
        await conn.query(
          `UPDATE products SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
          [...keys.map((k) => changes[k]), pid],
        );
      }
      if (photoChanged) {
        const img = resolveImage(p.fotoUrl, written);
        if (img) {
          const [imgRows] = await conn.query('SELECT image_url FROM product_images WHERE product_id = ?', [pid]);
          (imgRows as Array<{ image_url: string }>).forEach((r) => {
            const f = path.basename(String(r.image_url));
            if (marker.files.includes(f)) obsoleteFiles.push(f);
          });
          await conn.query('DELETE FROM product_images WHERE product_id = ?', [pid]);
          await conn.query(
            'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, 1, 0)',
            [pid, img, name],
          );
        }
        photos[key] = hash;
      }
      if ((keys.length > 0 && !(keys.length === 1 && keys[0] === 'is_active')) || photoChanged) result.updated++;
    }

    // Produk yang sudah tidak ada di SCM → nonaktifkan & lepas tautannya.
    const live = new Set(scm.map(scmKey));
    for (const [key, pid] of Object.entries(map)) {
      if (live.has(key)) continue;
      const row = existing.get(pid);
      if (row && Number(row.is_active) === 1) {
        await conn.query('UPDATE products SET is_active = 0 WHERE id = ?', [pid]);
        result.deactivated++;
      }
      delete map[key];
      delete photos[key];
      delete scmActive[key];
    }

    await conn.commit();

    const ids = [...new Set([...marker.ids.filter((id) => existing.has(id)), ...Object.values(map)])];
    const files = [...marker.files.filter((f) => !obsoleteFiles.includes(f)), ...written];
    await upsertLandingContent({
      [MARKER_KEY]: JSON.stringify({ ids, files, map, photos, scmActive } satisfies Marker),
    });
    obsoleteFiles.forEach((f) => fs.rmSync(path.join(config.upload.dir, f), { force: true }));
    lastSyncAt = new Date().toISOString();
    return result;
  } catch (e) {
    await conn?.rollback().catch(() => 0);
    written.forEach((f) => fs.rmSync(path.join(config.upload.dir, f), { force: true }));
    throw e;
  } finally {
    syncing = false;
    conn?.release();
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
