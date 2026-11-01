import dbPool from '../../lib/db';
import seedData from '../../data/catalog_reference.json';
import { upsertLandingContent } from '../landing_content_service';

// ---------------------------------------------------------------------------
// Seeder Konten — isi / hapus produk, artikel & kartu "Lacak Paket" contoh dari
// data yang sudah ada di `data/catalog_reference.json` (snapshot data produksi).
//
// Produk:
//   applyProductSeed() → tulis produk snapshot (ID tetap) + fotonya, kategori yang
//                        belum ada ikut dibuat. Produk snapshot yang masih ada
//                        dikembalikan ke isi snapshot; produk buatan admin aman.
//   clearProductSeed() → hapus produk snapshot saja (dikenali dari ID-nya).
//
// Artikel:
//   applyArticleSeed() → tulis artikel snapshot dengan ID tetap. Artikel snapshot
//                        lama (ID / slug sama) diganti dulu, jadi klik berulang
//                        tidak menumpuk duplikat.
//   clearArticleSeed() → hapus artikel snapshot saja (dikenali dari ID-nya).
//                        Artikel yang dibuat admin sendiri TIDAK disentuh.
//
// Lacak pesanan:
//   applyTrackingSeed() / clearTrackingSeed() → isi / kosongkan landing_content
//   key `demoTracking`. Halaman Lacak Paket menampilkan kartunya otomatis.
//
// Relasi artikel→produk (article_products) dari snapshot dipasang lagi saat
// apply artikel, hanya untuk produk yang masih ada.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
const SEED = seedData as unknown as {
  categories: Row[];
  products: Row[];
  product_images: Row[];
  featured_product_ids?: string[];
  articles: Row[];
  article_products?: Row[];
  demo_tracking?: Row;
};
const PRODUCTS = SEED.products || [];
const PRODUCT_IDS = PRODUCTS.map((p) => Number(p.id));
const ARTICLES = SEED.articles || [];
const ARTICLE_IDS = ARTICLES.map((a) => Number(a.id));
const ARTICLE_SLUGS = ARTICLES.map((a) => String(a.slug));

// Objek/array → JSON (kolom content_blocks/facts), ISO string → DATETIME MySQL.
function toSqlValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  return value;
}

async function getTableColumns(table: string): Promise<Set<string>> {
  const [rows] = await dbPool.query(
    'SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?',
    [table],
  );
  return new Set((rows as Array<{ COLUMN_NAME: string }>).map((r) => r.COLUMN_NAME));
}

export async function getContentSeedStatus() {
  const [[allProducts], [seededProducts], [all], [seeded], [tracking]] = await Promise.all([
    dbPool.query('SELECT COUNT(*) AS total FROM products'),
    PRODUCT_IDS.length
      ? dbPool.query('SELECT COUNT(*) AS total FROM products WHERE id IN (?)', [PRODUCT_IDS])
      : Promise.resolve([[{ total: 0 }]] as unknown as [unknown]),
    dbPool.query('SELECT COUNT(*) AS total FROM articles'),
    ARTICLE_IDS.length
      ? dbPool.query('SELECT COUNT(*) AS total FROM articles WHERE id IN (?)', [ARTICLE_IDS])
      : Promise.resolve([[{ total: 0 }]] as unknown as [unknown]),
    dbPool.query('SELECT `value` FROM landing_content WHERE `key` = ?', ['demoTracking']),
  ]);
  const total = (r: unknown) => Number((r as Array<{ total: number }>)[0]?.total || 0);
  const trackingRaw = (tracking as Array<{ value: string }>)[0]?.value || '';
  let trackingResi: string | null = null;
  try {
    trackingResi = trackingRaw ? (JSON.parse(trackingRaw)?.noResi ?? null) : null;
  } catch {
    trackingResi = null;
  }
  return {
    productCount: total(allProducts),
    seededProductCount: total(seededProducts),
    seedProductTotal: PRODUCTS.length,
    articleCount: total(all),
    seededArticleCount: total(seeded),
    seedArticleTotal: ARTICLES.length,
    trackingActive: Boolean(trackingResi),
    trackingResi,
    seedTrackingResi: (SEED.demo_tracking?.noResi as string | undefined) ?? null,
  };
}

// Kolom snapshot yang ada di tabel → INSERT banyak baris sekaligus.
function insertRows(table: string, rows: Row[], allowed: Set<string>, omit: string[] = []) {
  const columns = Object.keys(rows[0]).filter((c) => allowed.has(c) && !omit.includes(c));
  const params: unknown[] = [];
  const tuples = rows.map((row) => `(${columns.map((c) => (params.push(toSqlValue(row[c])), '?')).join(', ')})`);
  return {
    sql: `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES ${tuples.join(', ')}`,
    params,
  };
}

export async function applyProductSeed(): Promise<{ created: number; skipped: number }> {
  if (PRODUCTS.length === 0) return { created: 0, skipped: 0 };
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();

    // Kategori snapshot yang belum ada (ID & slug) dibuat dulu.
    const [catRows] = await conn.query('SELECT id, slug FROM categories');
    const catIds = new Set((catRows as Array<{ id: number }>).map((r) => Number(r.id)));
    const catSlugs = new Set((catRows as Array<{ slug: string }>).map((r) => r.slug));
    const newCats = (SEED.categories || []).filter((c) => !catIds.has(Number(c.id)) && !catSlugs.has(String(c.slug)));
    if (newCats.length) {
      const q = insertRows('categories', newCats, await getTableColumns('categories'));
      await conn.query(q.sql, q.params);
      newCats.forEach((c) => catIds.add(Number(c.id)));
    }

    // Produk yang slug-nya sudah dipakai produk buatan admin dilewati (bukan ditimpa).
    const [slugRows] = await conn.query('SELECT id, slug FROM products WHERE slug IN (?) AND id NOT IN (?)', [
      PRODUCTS.map((p) => String(p.slug)),
      PRODUCT_IDS,
    ]);
    const takenSlugs = new Set((slugRows as Array<{ slug: string }>).map((r) => r.slug));
    const rows = PRODUCTS.filter((p) => !takenSlugs.has(String(p.slug)) && catIds.has(Number(p.category_id)));
    const ids = rows.map((p) => Number(p.id));

    if (rows.length) {
      // UPSERT (bukan hapus-tulis ulang) supaya keranjang & wishlist pelanggan tetap utuh.
      const allowed = await getTableColumns('products');
      const q = insertRows('products', rows, allowed);
      const cols = Object.keys(rows[0]).filter((c) => allowed.has(c) && c !== 'id');
      await conn.query(`${q.sql} ON DUPLICATE KEY UPDATE ${cols.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ')}`, q.params);

      await conn.query('DELETE FROM product_images WHERE product_id IN (?)', [ids]);
      const images = (SEED.product_images || []).filter((i) => ids.includes(Number(i.product_id)));
      if (images.length) {
        const qi = insertRows('product_images', images, await getTableColumns('product_images'), ['id']);
        await conn.query(qi.sql, qi.params);
      }
    }
    await conn.commit();

    if (SEED.featured_product_ids?.length) {
      await upsertLandingContent({ featuredProductIds: JSON.stringify(SEED.featured_product_ids) });
    }
    return { created: rows.length, skipped: PRODUCTS.length - rows.length };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Foreign key: foto, keranjang, wishlist & relasi artikel ikut terhapus (CASCADE);
// riwayat pesanan tetap ada (order_items.product_id → NULL).
export async function clearProductSeed(): Promise<{ removed: number }> {
  if (PRODUCT_IDS.length === 0) return { removed: 0 };
  const [r] = await dbPool.query('DELETE FROM products WHERE id IN (?)', [PRODUCT_IDS]);
  return { removed: (r as { affectedRows: number }).affectedRows };
}

export async function applyArticleSeed(): Promise<{ created: number }> {
  if (ARTICLES.length === 0) return { created: 0 };
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    // Ganti artikel snapshot lama (ID tetap) + artikel lain yang slug-nya bentrok.
    const [old] = await conn.query('SELECT id FROM articles WHERE id IN (?) OR slug IN (?)', [ARTICLE_IDS, ARTICLE_SLUGS]);
    const oldIds = (old as Array<{ id: number }>).map((r) => r.id);
    if (oldIds.length) {
      await conn.query('DELETE FROM article_products WHERE article_id IN (?)', [oldIds]);
      await conn.query('DELETE FROM articles WHERE id IN (?)', [oldIds]);
    }

    const q = insertRows('articles', ARTICLES, await getTableColumns('articles'));
    await conn.query(q.sql, q.params);

    const links = (SEED.article_products || []).filter((l) => ARTICLE_IDS.includes(Number(l.article_id)));
    if (links.length) {
      const [prodRows] = await conn.query('SELECT id FROM products WHERE id IN (?)', [links.map((l) => Number(l.product_id))]);
      const existing = new Set((prodRows as Array<{ id: number }>).map((r) => Number(r.id)));
      const values = links
        .filter((l) => existing.has(Number(l.product_id)))
        .map((l) => [Number(l.article_id), Number(l.product_id)]);
      if (values.length) await conn.query('INSERT INTO article_products (article_id, product_id) VALUES ?', [values]);
    }
    await conn.commit();
    return { created: ARTICLES.length };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function clearArticleSeed(): Promise<{ removed: number }> {
  if (ARTICLE_IDS.length === 0) return { removed: 0 };
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM article_products WHERE article_id IN (?)', [ARTICLE_IDS]);
    const [r] = await conn.query('DELETE FROM articles WHERE id IN (?)', [ARTICLE_IDS]);
    await conn.commit();
    return { removed: (r as { affectedRows: number }).affectedRows };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function applyTrackingSeed(): Promise<{ noResi: string | null }> {
  const t = SEED.demo_tracking;
  if (!t) return { noResi: null };
  await upsertLandingContent({ demoTracking: JSON.stringify(t) });
  return { noResi: (t.noResi as string) ?? null };
}

export async function clearTrackingSeed(): Promise<void> {
  await upsertLandingContent({ demoTracking: '' });
}
