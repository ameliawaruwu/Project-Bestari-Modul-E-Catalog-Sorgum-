import dbPool from '../lib/db';

export interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  is_published: number;
  published_at: string | null;
  created_at: string;
}

export async function getPublishedArticles(category?: string, limit = 12, offset = 0) {
  let where = 'WHERE is_published = 1';
  const params: any[] = [];
  if (category) { where += ' AND category = ?'; params.push(category); }

  const [countRows] = await dbPool.query(`SELECT COUNT(*) as total FROM articles ${where}`, params);
  const total = (countRows as any[])[0].total;

  const [rows] = await dbPool.query(
    `SELECT id, title, slug, category, excerpt, image_url, published_at, created_at FROM articles ${where} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return { data: rows as ArticleRow[], meta: { total, limit, offset } };
}

export async function getArticleBySlug(slug: string) {
  const [rows] = await dbPool.query(
    'SELECT * FROM articles WHERE slug = ? AND is_published = 1',
    [slug],
  );
  return (rows as ArticleRow[])[0] || null;
}

export async function getAllArticles() {
  const [rows] = await dbPool.query('SELECT * FROM articles ORDER BY created_at DESC');
  return rows as ArticleRow[];
}

export async function createArticle(fields: Record<string, any>) {
  const [r] = await dbPool.query(
    `INSERT INTO articles (title, slug, category, content, excerpt, image_url, is_published, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [fields.title, fields.slug, fields.category, fields.content, fields.excerpt || null,
     fields.image_url || null, fields.is_published ? 1 : 0,
     fields.is_published ? new Date() : null],
  );
  return (r as any).insertId;
}

export async function updateArticle(id: number, fields: Record<string, any>) {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
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
export async function getFaqs() {
  const [rows] = await dbPool.query('SELECT id, question, answer FROM faq ORDER BY sort_order ASC');
  return rows;
}

export async function createFaq(question: string, answer: string, sort_order = 0) {
  const [r] = await dbPool.query('INSERT INTO faq (question, answer, sort_order) VALUES (?, ?, ?)', [question, answer, sort_order]);
  return (r as any).insertId;
}

export async function updateFaq(id: number, fields: Record<string, any>) {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
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
