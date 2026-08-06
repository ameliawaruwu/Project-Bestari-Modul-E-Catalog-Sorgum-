BATASAN PROMPT — UI REDESIGN E-Catalog Sorgum
    
    1. Scope ketat: yang boleh diubah HANYA tampilan (layout, warna, spacing, tipografi, ikon) di file yang saya sebutkan. JANGAN ubah: logic, state management, API call, bentuk data,
    validasi, konten teks fungsional. Kalau redesign butuh sentuh logic → wajib diskusi dulu, bukan diam-diam.
    
    2. JANGAN SENTUH (absolut): 
       - localStorage keys bestari_* (salah ubah = semua user logout)
       - API contract (endpoint, response shape) — primary_image, order_status, dll
       - Struktur/schema DB, migrasi
       - ID internal produk/order (tetap boleh dipakai di kode, cuma jangan tampil di UI)
    
    3. WAJIB PERTAHANKAN (sudah disepakati 2026-08-05):
       - Hati polos/ikon favorit DI BARIS KATEGORI — bukan di card produk
       - Card produk TANPA ikon mata & badge "-X%"; harga coret tetap dipertahankan
       - Tombol favorit di halaman detail: warna tetap seperti sekarang
       - Tabel Kelola Produk: 6 kolom, urutan id DESC, tanpa scroll horizontal
       - ID produk tidak boleh tampil di UI mana pun
       - Qty di detail: tombol +/- (bukan input bebas)
    
    4. Design system (tetap, jangan ganti): palet hijau tua #162809/#2b3e1d, krem #f9f3ec/#f3ede6, border #c4c8bc, aksen #fade88; font Plus Jakarta Sans (body) + JetBrains
    Mono (angka/harga); ikon Material Symbols Outlined. Tidak menambah font/library/CSS framework baru tanpa diskusi.
    
    5. Bahasa: copy UI bilingual ID/EN lewat t() — jangan hardcode teks baru. Harga format Rp X.XXX (id-ID). Judul/halaman pakai "SORGUM" (bukan BESTARI).
    
    6. Responsif & fungsi: jangan pecah layout mobile; jangan menghilangkan fungsi elemen (dropdown status, tombol aksi, form). Redesign tidak boleh bikin elemen yang tadinya bisa
    diklik jadi tidak bisa.
    
    7. Animasi: ringan saja (fade/slide halus). Tidak ada animasi berat/marquee/parallax tanpa izin.
    
    8. Verifikasi: WAJIB npx tsc --noEmit (FE, dan BE kalau menyentuh backend) + review kode. TIDAK menjalankan test browser/Playwright/E2E tanpa izin eksplisit.
    
    9. Proses: redesign besar → tampilkan rencana/draft (file mana, apa yang berubah) DULU, diskusi, baru eksekusi. Tidak auto-commit/push/deploy — selalu tanya dulu.
    
    10. Anti-regresi: sebelum ubah, bandingkan dengan kondisi sekarang (screenshot/deskripsi). Kalau ada elemen yang sengaja dipertahankan (poin 3), jangan sampai kehilangan karena
    "kebawa" redesign.