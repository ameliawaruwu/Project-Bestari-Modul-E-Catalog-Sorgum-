# Daftar Fitur Utama
## BESTARI - Sorgum E-Catalog

Berikut adalah daftar fitur utama pada aplikasi **BESTARI Sorgum E-Catalog**, dibagi berdasarkan pengguna (Pengunjung/Pembeli dan Administrator):

---

### A. Fitur Pengunjung / Pembeli (Katalog Publik)

1. **Beranda Interaktif (Home Page)**
   - **Hero Banner Slider**: Menampilkan promo dan informasi unggulan yang dapat dikontrol dari admin.
   - **Koleksi Produk Pilihan**: Menampilkan produk unggulan yang dikurasi khusus oleh admin.
   - **Pencarian Cepat**: Kolom pencarian instan di halaman utama untuk menemukan produk dengan cepat.
   - **Banner Kemitraan & Pasokan B2B**: Akses cepat konsultasi kemitraan usaha (hotel, resto, produsen makanan sehat) via WhatsApp.

2. **Katalog & Eksplorasi Produk**
   - **Pencarian Produk**: Pencarian kata kunci berdasarkan nama produk, deskripsi, atau kemasan.
   - **Filter & Kategori**: Penyaringan produk berdasarkan kategori olahan sorgum (Beras, Tepung, Camilan, dsb.).
   - **Pengurutan (Sorting)**: Urutkan produk berdasarkan *Populer*, *Harga Terendah*, *Harga Tertinggi*, atau *Terbaru*.

3. **Detail Produk (Shopee-Style Layout)**
   - **Galeri Foto Multi-Gambar**: Tampilan foto utama dan thumbnail galeri untuk melihat produk dari berbagai sudut.
   - **Harga Fleksibel**: Menampilkan harga tetap atau rentang harga (min - max).
   - **Spesifikasi & Deskripsi Lengkap**: Informasi berat/kemasan, jangkauan pengiriman nusantara, dan deskripsi produk yang dapat diperluas (*expand/collapse*).
   - **Pemesanan Langsung via WhatsApp (Direct Order)**: Tombol pemesanan yang otomatis mengarahkan ke WhatsApp admin/PIC produk dengan template chat yang sudah terisi nama produk yang dipilih.
   - **Rekomendasi Produk Terkait**: Menampilkan produk sejenis di bawah halaman detail.

4. **Pelacakan Pengiriman (Live Tracking)**
   - **Dukungan 61 Ekspedisi**: Cek nomor resi pengiriman untuk 61 kurir di Indonesia (J&T, JNE, Shopee Express/SPX, SiCepat, Lion Parcel, Pos Indonesia, TIKI, Anteraja, Wahana, dsb.).
   - **Pencarian Ekspedisi Interaktif**: Dropdown pemilihan kurir yang dapat dicari dengan cepat.
   - **Timeline Perjalanan Paket**: Menampilkan status terkini, data penerima/pengirim, dan riwayat perjalanan paket secara real-time.
   - **Tombol Bantuan WhatsApp**: Akses bantuan langsung ke admin jika ada kendala paket/resi.

5. **Pusat Informasi & Edukasi Sorgum (Artikel/Blog)**
   - **Kategori Artikel**: Pilihan topik *Budidaya*, *Nutrisi*, *Inspirasi Resep*, dan *Promosi*.
   - **Pencarian & Pagination**: Pencarian artikel dan pembagian halaman yang rapi.
   - **Halaman Baca Lengkap**: Dilengkapi gambar pendukung, kutipan (*quotes*), dan fakta nutrisi singkat.
   - **Tautan Produk Terkait (Cross-Selling)**: Menampilkan kartu produk sorgum yang relevan di dalam artikel edukasi yang sedang dibaca.

6. **Pengalaman Pengguna (User Experience)**
   - **Dwibahasa (i18n)**: Dukungan Bahasa Indonesia & English secara instan tanpa perlu reload.
   - **Mode Gelap / Terang (Dark/Light Theme)**: Pilihan tampilan yang nyaman di mata.
   - **Navigasi Mobile**: Dilengkapi navigasi bawah (*Bottom Navigation Bar*) untuk kenyamanan pengguna HP/smartphone.
   - **Notifikasi Status Jaringan**: Modal otomatis jika terjadi kendala jaringan dengan auto-retry.

---

### B. Fitur Administrator (Panel Back-Office `/admin`)

1. **Autentikasi & Keamanan**
   - Login admin dengan email dan password yang terenkripsi (JWT Authentication).
   - Perlindungan *Rate Limiting* untuk mencegah percobaan login berulang (brute-force).

2. **Dashboard Toko**
   - Ringkasan statistik jumlah produk, artikel edukasi, dan banner promosi yang aktif.
   - Tombol pintas untuk tambah produk dan cek pratinjau toko.

3. **Kelola Konten Beranda (Landing CMS)**
   - **Manajemen Banner**: Tambah, edit, hapus, dan aktifkan/nonaktifkan slide banner promo.
   - **Kustomisasi Teks Beranda**: Mengubah judul hero, deskripsi, dan keunggulan produk di landing page.
   - **Kurasi Produk Pilihan**: Memilih produk apa saja yang ingin ditampilkan di section produk pilihan beranda.

4. **Kelola Produk (Product Management)**
   - Tambah, edit, dan hapus produk (CRUD).
   - Pengaturan nama, kategori, harga tunggal / rentang harga, berat/kemasan, dan deskripsi.
   - Upload galeri foto produk dengan kompresi otomatis client-side (<1 MB).
   - Nomor WhatsApp khusus per produk (opsional jika memiliki PIC berbeda).

5. **Kelola Artikel Informasi (Article Management)**
   - Tambah, edit, dan hapus artikel informasi/blog.
   - Pengaturan konten kaya: gambar sampul, sub-gambar, kutipan, dan fakta nutrisi.
   - **Tagging Produk ke Artikel**: Menautkan produk tertentu yang relevan ke dalam artikel.

6. **Pengaturan Toko (Shop Settings)**
   - Pengaturan nama toko, alamat operasional, dan email.
   - Pengaturan nomor WhatsApp utama penerima order.
   - Upload logo toko dan favicon.

7. **Sinkronisasi Real-Time (Server-Sent Events / SSE)**
   - Setiap pembaruan data oleh admin (produk, banner, artikel, pengaturan) langsung tersinkronisasi ke layar pengunjung secara otomatis tanpa perlu refresh halaman manual.
