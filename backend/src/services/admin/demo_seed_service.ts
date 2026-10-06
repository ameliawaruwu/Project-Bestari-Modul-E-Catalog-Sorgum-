import dbPool from '../../lib/db';
import seedData from '../../data/demo_seed.json';
import { upsertLandingContent } from '../landing_content_service';

// ---------------------------------------------------------------------------
// Demo Seeder — isi / kosongkan data konten toko untuk keperluan demo & testing.
//
// Sumber snapshot = DATA PRODUKSI (bukan data dev). Isi file `data/demo_seed.json`
// adalah salinan apa adanya dari tabel konten di server produksi, jadi menekan
// "Isi Data Demo" memulihkan tampilan toko persis seperti kondisi produksi.
//
// Dua aksi:
//   clearDemoContent()  → hapus ISI tabel konten (bukan tabelnya). Struktur
//                         tabel & akun admin TIDAK disentuh.
//   seedDemoContent()   → tulis snapshot data demo (produk, kategori, banner,
//                         artikel + relasinya) dengan ID tetap, supaya relasi
//                         antar data tetap konsisten.
//
// Kenapa ID tetap (bukan auto-increment)?
//   Data lain menyimpan referensi produk pakai ID sebagai teks:
//     landing_content.featuredProductIds = ["28","5","3","1","6"]  (produk unggulan beranda)
//     article_products.article_id / product_id
//   Kalau ID berubah tiap seed, "Koleksi Produk Pilihan" di beranda jadi kosong
//   dan artikel kehilangan produk terkaitnya. ID tetap = hasil seed selalu sama.
//
// Catatan gambar: gambar produk/banner di snapshot menunjuk file `/uploads/...`
// di server (bukan URL eksternal). File fisiknya ada di
// `backend/uploads_ecatalog_bestari/` dan TIDAK ikut git — jadi seeder hanya
// memulihkan baris DB-nya; file harus sudah ada di server tujuan. Karena
// "Kosongkan Data" juga tidak menghapus file di disk, isi → kosongkan → isi
// ulang aman dilakukan berulang di server yang sama.
//
// Yang TIDAK pernah disentuh: users (akun admin), site_settings (nama toko, WA,
// logo, QRIS), badges. Dari landing_content, HANYA featuredProductIds yang
// disesuaikan (dikosongkan saat clear, diisi ID yang benar saat apply) — teks
// beranda lainnya tetap.
// ---------------------------------------------------------------------------

// Nama tabel yang dihapus isinya. Urutan PENTING: child dulu, parent terakhir.
// products.category_id → categories pakai ON DELETE RESTRICT, jadi produk harus
// dihapus sebelum kategori (kalau tidak, MySQL menolak).
const CONTENT_TABLES_IN_DELETE_ORDER = [
  'product_images',
  'article_products',
  'products',
  'articles',
  'categories',
  'banners',
] as const;

export interface SeedCounts {
  categories: number;
  products: number;
  product_images: number;
  banners: number;
  articles: number;
  article_products: number;
}

interface SeedFile {
  categories: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  product_images: Array<Record<string, unknown>>;
  banners: Array<Record<string, unknown>>;
  articles: Array<Record<string, unknown>>;
  article_products: Array<Record<string, unknown>>;
  featured_product_ids: string[];
}

const SEED = seedData as unknown as SeedFile;

// Produk unggulan di beranda diambil dari landing_content.featuredProductIds
// (JSON array berisi ID produk sebagai STRING). Kalau tidak diperbaiki, beranda
// tampil kosong di bagian "Koleksi Produk Pilihan" meski seeder sukses —
// karena array itu masih menunjuk ID lama yang sudah tidak ada.
// Daftar diambil dari file seed, tapi disaring dulu: hanya ID yang benar-benar
// ikut ter-seed yang dipakai, supaya tidak ada referensi menggantung.
const SEEDED_PRODUCT_IDS = new Set(SEED.products.map((p) => String(p.id)));
const FEATURED_IDS = (SEED.featured_product_ids || []).filter((id) => SEEDED_PRODUCT_IDS.has(String(id)));

// Ubah nilai JS jadi nilai yang diterima MySQL.
// - Objek/array → string JSON (kolom content_blocks/facts bertipe JSON).
// - String ISO 8601 (mis. "2023-10-12T01:00:00.000Z" hasil ekspor JSON) →
//   format DATETIME MySQL "YYYY-MM-DD HH:MM:SS". Tanpa ini, INSERT gagal
//   "Incorrect datetime value" untuk kolom published_at.
function toSqlValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  return value;
}

// Bangun satu statement INSERT multi-baris dari array objek.
// Nilai selalu lewat placeholder (?) — tidak ada string yang di-rakit ke SQL,
// jadi aman dari injeksi meski isi file JSON nanti diubah.
//
// `allowedColumns` = daftar kolom yang BENAR-BENAR ada di tabel tujuan
// (dibaca dari information_schema). Snapshot boleh berisi kolom yang tidak ada
// di suatu environment (mis. `discount_percent`/`badge_color` cuma ada di DB
// produksi) — kolom seperti itu dibuang otomatis, bukan bikin INSERT gagal.
function buildInsert(
  table: string,
  rows: Array<Record<string, unknown>>,
  allowedColumns: Set<string>,
): { sql: string; params: unknown[] } {
  if (rows.length === 0) return { sql: '', params: [] };

  // Ambil irisan kolom: urutan ikut baris pertama, hanya yang diizinkan.
  const columns = Object.keys(rows[0]).filter((c) => allowedColumns.has(c));
  if (columns.length === 0) return { sql: '', params: [] };

  const params: unknown[] = [];
  const tuples = rows.map((row) => {
    const marks = columns.map((col) => {
      params.push(toSqlValue(row[col]));
      return '?';
    });
    return `(${marks.join(', ')})`;
  });
  const sql = `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES ${tuples.join(', ')}`;
  return { sql, params };
}

// Baca daftar kolom asli sebuah tabel dari information_schema (sekali per tabel).
async function getTableColumns(table: string): Promise<Set<string>> {
  const [rows] = await dbPool.query(
    'SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?',
    [table],
  );
  return new Set((rows as Array<{ COLUMN_NAME: string }>).map((r) => r.COLUMN_NAME));
}

// Hapus ISI tabel konten. Struktur tabel tetap utuh; akun admin & pengaturan
// toko tidak disentuh. Dijalankan dalam satu transaksi: kalau ada yang gagal,
// semuanya di-rollback (tidak ada data separuh terhapus).
export async function clearDemoContent(): Promise<SeedCounts> {
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();

    const removed: Record<string, number> = {};
    for (const table of CONTENT_TABLES_IN_DELETE_ORDER) {
      const [result] = await conn.query(`DELETE FROM \`${table}\``);
      removed[table] = (result as { affectedRows: number }).affectedRows;
    }

    await conn.commit();

    // featuredProductIds menunjuk ID produk. Setelah produk dihapus, array itu
    // jadi referensi menggantung → dikosongkan supaya beranda tidak menunjuk
    // produk yang sudah tidak ada. (Key lain di landing_content tidak disentuh.)
    await upsertLandingContent({ featuredProductIds: '[]' }).catch(() => 0);

    return removed as unknown as SeedCounts;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Tulis snapshot data demo. Idempotent: isi tabel konten dibersihkan dulu di
// dalam transaksi yang sama, jadi klik berulang menghasilkan data yang sama
// (tidak menumpuk duplikat).
export async function seedDemoContent(): Promise<SeedCounts> {
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();

    // Bersihkan dulu supaya tidak bentrok UNIQUE (slug) & supaya ID tetap konsisten.
    for (const table of CONTENT_TABLES_IN_DELETE_ORDER) {
      await conn.query(`DELETE FROM \`${table}\``);
    }

    // Urutan INSERT: parent dulu (kategori → produk → gambar), karena ada FK.
    // Tipe dibatasi ke kunci tabel saja (featured_product_ids bukan tabel).
    type TableKey = 'categories' | 'products' | 'product_images' | 'banners' | 'articles' | 'article_products';
    const order: Array<[TableKey, string]> = [
      ['categories', 'categories'],
      ['products', 'products'],
      ['product_images', 'product_images'],
      ['banners', 'banners'],
      ['articles', 'articles'],
      ['article_products', 'article_products'],
    ];

    const inserted: Record<string, number> = {};
    for (const [key, table] of order) {
      const rows = SEED[key] || [];
      if (rows.length === 0) {
        inserted[table] = 0;
        continue;
      }
      // Saring kolom sesuai skema tabel yang ada di DB ini (bukan sesuai isi file).
      const allowed = await getTableColumns(table);
      const { sql, params } = buildInsert(table, rows, allowed);
      if (!sql) {
        inserted[table] = 0;
        continue;
      }
      await conn.query(sql, params);
      inserted[table] = rows.length;
    }

    // Catatan: AUTO_INCREMENT tidak perlu di-set manual. InnoDB otomatis
    // menaikkan counter-nya saat kita meng-INSERT nilai id eksplisit yang lebih
    // besar, jadi produk baru setelah seed tetap dapat id di atas id tertinggi
    // (mis. max id 40 → produk baru dapat 41). Sebelumnya ada `ALTER TABLE ...
    // AUTO_INCREMENT` di sini — dihapus karena DDL memicu IMPLICIT COMMIT di
    // MySQL, sehingga transaksi ter-commit lebih awal dan jaminan "semua atau
    // tidak sama sekali" jadi palsu.

    await conn.commit();

    // Perbaiki daftar produk unggulan beranda supaya menunjuk ID yang benar-benar
    // ada. Dilakukan SETELAH commit (upsertLandingContent pakai pool sendiri) dan
    // tidak fatal kalau gagal — data produk sudah tersimpan dengan benar.
    if (FEATURED_IDS.length > 0) {
      await upsertLandingContent({ featuredProductIds: JSON.stringify(FEATURED_IDS) }).catch(() => 0);
    }

    return inserted as unknown as SeedCounts;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Jumlah baris tiap tabel konten — dipakai panel admin untuk menampilkan
// kondisi data saat ini tanpa harus memanggil endpoint publik satu per satu.
export async function getContentCounts(): Promise<Record<string, number>> {
  const tables = ['products', 'categories', 'banners', 'articles'];
  const out: Record<string, number> = {};
  for (const table of tables) {
    const [rows] = await dbPool.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
    out[table] = Number((rows as Array<{ total: number }>)[0]?.total || 0);
  }
  return out;
}
