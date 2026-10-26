import dbPool from '../../lib/db';
import seedData from '../../data/catalog_reference.json';
import { upsertLandingContent } from '../landing_content_service';

// ---------------------------------------------------------------------------
// Seeder Konten — isi / hapus artikel & kartu "Lacak Paket" contoh dari data
// yang sudah ada di `data/catalog_reference.json` (snapshot data produksi).
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
// Produk tidak disentuh di sini (sumbernya Seeder SCM). Relasi artikel→produk
// (article_products) ikut dihapus untuk artikel snapshot karena ID produk SCM
// berubah tiap fetch.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
const SEED = seedData as unknown as { articles: Row[]; demo_tracking?: Row };
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
  const [[all], [seeded], [tracking]] = await Promise.all([
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
    articleCount: total(all),
    seededArticleCount: total(seeded),
    seedArticleTotal: ARTICLES.length,
    trackingActive: Boolean(trackingResi),
    trackingResi,
    seedTrackingResi: (SEED.demo_tracking?.noResi as string | undefined) ?? null,
  };
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

    const allowed = await getTableColumns('articles');
    const columns = Object.keys(ARTICLES[0]).filter((c) => allowed.has(c));
    const params: unknown[] = [];
    const tuples = ARTICLES.map((row) => `(${columns.map((c) => (params.push(toSqlValue(row[c])), '?')).join(', ')})`);
    await conn.query(
      `INSERT INTO articles (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES ${tuples.join(', ')}`,
      params,
    );
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
