-- ================================================
-- BESTARI E-Catalog - Migration 023: Hapus fitur FAQ
-- ================================================
-- FAQ dihapus total dari produk (FE + BE). Tabel `faq`
-- tidak dipakai lagi — di-drop. Migration file 001/002
-- (riwayat) TIDAK diubah.
-- ================================================

DROP TABLE IF EXISTS faq;
