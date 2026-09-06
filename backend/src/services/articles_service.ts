import dbPool from '../lib/db';

// Ambil id produk yang ter-tag ke artikel (relasi article_products).
async function getProductIdsForArticle(articleId: number): Promise<number[]> {
  const [rows] = await dbPool.query(
    'SELECT product_id FROM article_products WHERE article_id = ? ORDER BY id ASC',
    [articleId],
  );
  return (rows as any[]).map((r) => r.product_id);
}

// Ambil detail produk terkait (aktif) dari relasi article_products.
async function getRelatedProductsForArticle(articleId: number): Promise<any[]> {
  const [rows] = await dbPool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.stock, p.is_active, p.weight_spec,
            p.wa_contact,
            (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) AS primary_image,
            c.name AS category_name
     FROM article_products ap
     JOIN products p ON p.id = ap.product_id
     JOIN categories c ON c.id = p.category_id
     WHERE ap.article_id = ? AND p.is_active = 1
     ORDER BY ap.id ASC`,
    [articleId],
  );
  return rows as any[];
}

// Ganti semua relasi artikel↔produk sekaligus (idempotent, transactional).
export async function replaceArticleProducts(articleId: number, productIds: number[]) {
  const clean = (Array.isArray(productIds) ? productIds : [])
    .map((id) => parseInt(String(id)))
    .filter((id) => !isNaN(id) && id > 0);
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM article_products WHERE article_id = ?', [articleId]);
    for (const pid of clean) {
      await conn.query(
        'INSERT IGNORE INTO article_products (article_id, product_id) VALUES (?, ?)',
        [articleId, pid],
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  content: string;
  content_blocks?: string | Array<Record<string, any>> | null;
  excerpt: string | null;
  image_url: string | null;
  is_published: number;
  published_at: string | null;
  created_at: string;
  author?: string | null;
  author_role?: string | null;
  read_time?: string | null;
  sub_image?: string | null;
  quote?: string | null;
  facts?: string | null;
}

export async function getPublishedArticles(category?: string, limit = 12, offset = 0) {
  let where = 'WHERE is_published = 1';
  const params: any[] = [];
  if (category) { where += ' AND category = ?'; params.push(category); }

  const [countRows] = await dbPool.query(`SELECT COUNT(*) as total FROM articles ${where}`, params);
  const total = (countRows as any[])[0].total;

  const rows = (await dbPool.query(
    `SELECT id, title, slug, category, excerpt, image_url, content, content_blocks, published_at, created_at, author, author_role, read_time, sub_image, quote, facts FROM articles ${where} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  ))[0] as ArticleRow[];

  for (const row of rows) {
    if (row.content_blocks && typeof row.content_blocks === 'string') {
      try { row.content_blocks = JSON.parse(row.content_blocks); } catch { row.content_blocks = null; }
    }
  }

  return { data: rows, meta: { total, limit, offset } };
}

export async function getArticleBySlug(slug: string) {
  const [rows] = await dbPool.query(
    'SELECT * FROM articles WHERE slug = ? AND is_published = 1',
    [slug],
  );
  const row = (rows as ArticleRow[])[0] || null;
  if (!row) return null;
  // Parse content_blocks (JSON string dari MySQL) → array
  if (row.content_blocks && typeof row.content_blocks === 'string') {
    try { row.content_blocks = JSON.parse(row.content_blocks); } catch { row.content_blocks = null; }
  }
  // Lampirkan produk terkait (relasi article_products) untuk tampil di detail artikel.
  const article: any = { ...row };
  article.product_ids = await getProductIdsForArticle(row.id);
  article.related_products = await getRelatedProductsForArticle(row.id);
  return article;
}

export async function getAllArticles() {
  const [rows] = await dbPool.query('SELECT * FROM articles ORDER BY created_at DESC');
  const list = rows as ArticleRow[];
  const enriched: any[] = [];
  for (const row of list) {
    if (row.content_blocks && typeof row.content_blocks === 'string') {
      try { row.content_blocks = JSON.parse(row.content_blocks); } catch { row.content_blocks = null; }
    }
    // Lampirkan product_ids (tag produk) — dipakai form edit artikel di admin.
    const item: any = { ...row };
    item.product_ids = await getProductIdsForArticle(row.id);
    enriched.push(item);
  }
  return enriched;
}

export async function createArticle(fields: Record<string, any>) {
  const [r] = await dbPool.query(
    `INSERT INTO articles (title, slug, category, content, content_blocks, excerpt, image_url, is_published, published_at,
      author, author_role, read_time, sub_image, quote, facts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fields.title, fields.slug, fields.category, fields.content, fields.content_blocks ? JSON.stringify(fields.content_blocks) : null,
     fields.excerpt || null,
     fields.image_url || null, fields.is_published ? 1 : 0,
     fields.is_published ? new Date() : null,
     fields.author || null, fields.author_role || null, fields.read_time || null,
     fields.sub_image || null, fields.quote || null,
     fields.facts ? JSON.stringify(fields.facts) : null],
  );
  return (r as any).insertId;
}

const ARTICLE_ALLOWED_COLUMNS = [
  'title', 'slug', 'category', 'content', 'content_blocks', 'excerpt', 'image_url',
  'is_published', 'published_at', 'author', 'author_role', 'read_time',
  'sub_image', 'quote', 'facts',
];

export async function updateArticle(id: number, fields: Record<string, any>) {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    // Whitelist kolom — cegah SQL injection via dynamic column name
    if (!ARTICLE_ALLOWED_COLUMNS.includes(k)) continue;
    if (v === undefined) continue;
    if (k === 'content_blocks') {
      sets.push('content_blocks = ?');
      vals.push(Array.isArray(v) ? JSON.stringify(v) : v);
      continue;
    }
    if (k === 'is_published') {
      sets.push('is_published = ?');
      vals.push(v ? 1 : 0);
      if (v) { sets.push('published_at = ?'); vals.push(new Date()); }
    } else {
      sets.push(`${k} = ?`);
      vals.push(v);
    }
  }
  if (sets.length === 0) return false;
  vals.push(id);
  const [r] = await dbPool.query(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`, vals);
  return (r as any).affectedRows > 0;
}

export async function deleteArticle(id: number) {
  const [r] = await dbPool.query('DELETE FROM articles WHERE id = ?', [id]);
  return (r as any).affectedRows > 0;
}

// FAQ
// FAQ — public: cuma AKTIF; admin: include DRAFT
export async function getFaqs(includeInactive = false) {
  const where = includeInactive ? '' : 'WHERE status = \'AKTIF\'';
  const [rows] = await dbPool.query(
    `SELECT id, question, answer, sort_order, category, status, tags, views_count, updated_at, created_at FROM faq ${where} ORDER BY sort_order ASC`
  );
  return rows;
}

export async function createFaq(fields: Record<string, any>) {
  const [r] = await dbPool.query(
    `INSERT INTO faq (question, answer, sort_order, category, status, tags)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      fields.question,
      fields.answer,
      fields.sort_order ?? fields.order ?? 0,
      fields.category || 'Lainnya',
      fields.status || 'AKTIF',
      fields.tags ? JSON.stringify(fields.tags) : null,
    ],
  );
  return (r as any).insertId;
}

const FAQ_ALLOWED_COLUMNS = ['question', 'answer', 'sort_order', 'category', 'status', 'tags'];

export async function updateFaq(id: number, fields: Record<string, any>) {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    // Whitelist kolom — cegah SQL injection via dynamic column name
    if (!FAQ_ALLOWED_COLUMNS.includes(k)) continue;
    if (v === undefined) continue;
    if (k === 'tags') {
      sets.push('tags = ?');
      vals.push(Array.isArray(v) ? JSON.stringify(v) : v);
    } else {
      sets.push(`${k} = ?`);
      vals.push(v);
    }
  }
  if (sets.length === 0) return false;
  vals.push(id);
  const [r] = await dbPool.query(`UPDATE faq SET ${sets.join(', ')} WHERE id = ?`, vals);
  return (r as any).affectedRows > 0;
}

export async function deleteFaq(id: number) {
  const [r] = await dbPool.query('DELETE FROM faq WHERE id = ?', [id]);
  return (r as any).affectedRows > 0;
}
