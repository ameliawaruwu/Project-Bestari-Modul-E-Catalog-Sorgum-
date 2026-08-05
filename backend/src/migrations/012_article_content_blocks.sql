-- Migration 012: content_blocks JSON — struktur blok terurut untuk isi artikel
-- [{type:'text'|'image'|'quote', content?, image_url?, alt?, caption?}, ...]
-- Konten lama (kolom content teks) tetap dipakai sebagai fallback render.
ALTER TABLE articles
  ADD COLUMN content_blocks JSON NULL AFTER content;
