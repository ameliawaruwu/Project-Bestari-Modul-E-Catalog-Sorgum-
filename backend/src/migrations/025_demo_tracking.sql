-- 025_demo_tracking.sql
-- Resi demo untuk keperluan presentasi/testing.
--
-- Latar belakang: halaman "Lacak Paket" TIDAK membaca DB — ia memanggil layanan
-- cek-resi eksternal (cekresi.com) lewat proxy. Jadi saat presentasi hasilnya
-- bergantung pada internet & ketersediaan layanan pihak ketiga.
--
-- Tabel ini menyimpan SALINAN hasil pelacakan sebuah resi (dibekukan sekali dari
-- layanan asli). Proxy /api/tracking/:resi mengecek tabel ini LEBIH DULU; kalau
-- resinya ada, hasil tersimpan dikembalikan tanpa memanggil layanan luar.
-- Resi yang tidak ada di tabel tetap dilacak seperti biasa (perilaku lama).
--
-- Tabel diisi/dikosongkan oleh fitur Data Demo (seeder) di panel admin, jadi
-- tidak perlu diisi manual.
--
-- Idempotent: error 1050 (table exists) di-skip oleh migrate.cjs.

CREATE TABLE IF NOT EXISTS demo_tracking (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- Nomor resi yang di-lookup user (disimpan uppercase untuk pencocokan).
  tracking_number VARCHAR(50)  NOT NULL,
  -- Kode ekspedisi (SPX, JNE, ...). Ikut disimpan supaya user bisa langsung
  -- melihat ekspedisinya, dan supaya cocok walau user memilih ekspedisi lain.
  courier         VARCHAR(30)  NOT NULL,
  -- Seluruh isi kartu disimpan sebagai satu JSON: {expedisi, noResi, status,
  -- pengirim, tujuan, penerima, perjalanan:[{tanggal,keterangan}]}.
  -- Disimpan utuh supaya penambahan field di masa depan tidak perlu ubah tabel.
  payload         JSON         NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_demo_tracking_number (tracking_number),
  INDEX idx_demo_tracking_courier (courier)
) ENGINE=InnoDB;
