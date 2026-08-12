# SORGUM E-Catalog — Dokumentasi Proses Bisnis (End-to-End)

> Versi: 2026-08-07 · Berdasarkan kode aktual (backend/src + src FE) + skema DB prod
> Aplikasi: E-Catalog produk olahan sorgum (Bestari → rebrand SORGUM)
> Stack: Express TS + MySQL (backend, port internal 20203) · React + Vite (FE, static dist/ via nginx e-catalog.kolab.top) · Cloudflare proxy

---

## 1. AKTOR & PERAN

| Aktor | Peran | Akses |
|---|---|---|
| **Guest** (belum login) | Lihat beranda/produk/informasi/FAQ, login, register | Read-only landing + auth |
| **User** (customer) | Belanja penuh: keranjang, checkout, pesanan, profil, favorit, voucher | Semua fitur user |
| **Admin** | Kelola seluruh toko: dashboard, produk, kategori, banner, transaksi, artikel, user, FAQ, voucher, landing, pengaturan | Panel admin (/api/admin/*) |

**Rule akses (FE guard, App.tsx):**
- Guest akses halaman protected → redirect ke login, setelah login balik ke halaman tujuan (redirectAfterLogin)
- User non-admin coba akses admin → dilempar ke beranda
- Admin akses halaman user → selalu dikunci ke panel admin (kecuali profil)
- Semua /api/admin/* dicek `authRequired + adminOnly` di BE

---

## 2. ARSITEKTUR

```
Browser (React SPA)
   │  /api/* (relative, proxy nginx)
   ▼
nginx (e-catalog.kolab.top, serve dist/ + proxy /api → BE)
   │
   ▼
Express BE (port internal 20203, PM2 bestari-be)
   │
   ├── MySQL (ecatalog_bestari_db, 18 tabel)
   ├── uploads/ (backend/uploads_ecatalog_bestari — diserve via /uploads statis)
   └── cek-resi external API (tracking/resi)
```

**Mount API (index.ts):**
- Public: /api/auth, /api/products, /api/categories, /api/cart, /api/orders, /api/tracking, /api/banners, /api/articles, /api/settings, /api/landing-content, /api/user, /api/wishlist, /api/vouchers
- Admin: /api/admin/dashboard, /api/admin/settings, /api/admin/products, /api/admin/categories, /api/admin/banners, /api/admin/articles, /api/admin/orders, /api/admin/tracking, /api/admin/upload, /api/admin/badges
- Statis: /uploads (Express static → folder upload)

---

## 3. PROSES BISNIS UTAMA

### 3.1 Registrasi & Login (Auth)

**Register** (POST /api/auth/register):
1. Cek email sudah terdaftar? → 409 "Email sudah terdaftar"
2. bcrypt hash password (cost 10)
3. INSERT users (name, email, password_hash, phone)
4. Return user (tanpa password)

**Login** (POST /api/auth/login):
1. Cari user by email
2. Kalau is_deleted=1 (soft delete) → 403 "Akun Anda telah dinonaktifkan. Silakan hubungi Admin."
3. bcrypt.compare password → salah → 401
4. Generate JWT (7 hari) → return token + user

**Sesi** (GET /api/auth/me):
- Validasi token; invalid/expired → bersihkan localStorage (cek di FE hydrate)

**Lupa password** (POST /api/auth/forgot-password + /reset-password):
- OTP via WhatsApp (GoWA webhook), TTL 5 menit (kolom password_reset_tokens)

**Logout:**
- FE: authApi.logout() → hapus token + bestari_current_user dari localStorage
- (Fix sesi nyangkut: dulu cuma set state React, localStorage basi → reload balik user lama)

### 3.2 Katalog & Produk

**Tampil produk** (GET /api/products):
- Filter: category (slug), searchQuery (nama LIKE), sortBy (Populer/Harga Terendah/Harga Tertinggi/Terbaru)
- Hanya is_active=1
- Setiap produk: primary_image = product_images yang is_primary=1
- Produk detail (GET /api/products/:slug): + semua images + attributes JSON + kategori

**Kategori** (GET /api/categories): list untuk nav & filter
**Featured** (GET /api/products/featured): produk unggulan di beranda

**Harga produk:**
- price = harga jual, original_price + discount_percent (0-90) = harga coret + badge diskon
- Diskon tampil di card sebagai badge -X% (harga coret tetap)

### 3.3 Keranjang (Cart)

**Sistem:** server-authoritative (DB cart_items), BUKAN localStorage.
- **User login**: cart_items.user_id = user.id
- **Guest**: cart_items.session_id = x-session-id header (FE generate sess-xxx di localStorage bestari_current_user)
- owner_key = user_id atau session_id (identitas pemilik)

**Operasi:**
- GET /api/cart → isi cart (dengan primary_image + harga + stock)
- POST /api/cart/add {product_id, quantity} → cek stock cukup, insert/update qty
- PUT /api/cart/:id {quantity} → update qty (min 1)
- DELETE /api/cart/:id → hapus item
- POST /api/cart/merge → gabung cart guest ke user saat login

**Alur guest → login:**
1. Guest isi cart (session_id)
2. Login/register → FE call merge → cart guest dipindah ke user_id, session cart dihapus
3. Selanjutnya cart pakai user_id

**FE sync:** AppContext.fetchCart setelah add/update/remove + refresh saat mount/hydrate.

### 3.4 Checkout (Order) — PROSES INTI

**Trigger:** CartPage/CheckoutPage → POST /api/orders (checkout)

**Validasi input (checkout_routes):**
- customer_name, customer_phone, shipping_address (object {recipient_name, phone, address, district, city, province, postal_code}), payment_method ('cod'|'qris') wajib
- authOptional: user login (token) ATAU guest (session_id) — keduanya bisa checkout

**createOrder (checkout_service) — 8 langkah transaksional:**
1. **Idempotency**: idempotency_key (FE generate UUID) → kalau sudah pernah dipakai → replay order existing (cegah double-submit; UNIQUE index + race handling ER_DUP_ENTRY)
2. **Ambil cart** → kosong → 400 "Keranjang kosong"
3. **Diskon**: HANYA dari voucher yang DIVERIFIKASI server-side (voucherService.validate: code valid, is_active, belum expired, belum lewat max_uses, min_purchase terpenuhi). discount = min(discount_amount, subtotal). **JANGAN percaya input.discount client.**
4. **Ongkir = 0** (dihapus 2026-08-07 — total = subtotal - diskon)
5. **Insert order** (order_number unik BST-XXXX, payment_method, status default: order_status='pending', payment_status='unpaid')
6. **Insert order_items** (SNAPSHOT: product_name + image_url + price — aman walau produk diedit/hapus nanti) + **decrement stock** (cek FOR UPDATE, stok cukup dulu — cegah over-selling)
7. **Voucher used_count++** (dalam transaksi sama)
8. **Clear cart** (dalam transaksi sama — konsisten: tidak ada order tanpa cart bersih)
9. Commit → generate WA link (wa.me admin + pesan "Halo SORGUM..." berisi nomor pesanan, nama, total, metode)

**Alur FE setelah order sukses:**
- COD → tab 'pesanan-berhasil' (OrderSuccessPage: ringkasan + button "Konfirmasi ke Admin via WhatsApp" — HANYA untuk non-QRIS)
- QRIS → tab 'qris-pembayaran' (QrisPaymentPage: gambar QRIS dinamis, refetch saat mount) → user scan & bayar → "Konfirmasi via WA" (QRIS TIDAK tampil button WA konfirmasi)
- Keterangan QRIS: "Pembayaran QRIS hanya untuk harga barang. Biaya ongkir belum termasuk — akan dikirim oleh admin setelah konfirmasi pesanan."

### 3.5 Status Order & Pembayaran (State Machine)

**order_status enum**: pending → confirmed → processed → shipped → delivered | cancelled
- Transisi (OPSI B longgar, keputusan user 2026-08-06): admin bebas set semua status kecuali TERMINAL (delivered/cancelled) tidak bisa berubah
- VALID_ORDER_STATUS + ALLOWED_ORDER_TRANSITIONS (BE validate)
- Idempotent: set status sama → sukses tanpa UPDATE

**payment_status enum**: unpaid → paid | confirmed
- Transisi longgar (bebas mundur: paid → unpaid kalau salah verifikasi)
- FE dropdown: Belum Bayar / Sudah Bayar (option confirmed TIDAK ditampilkan — keputusan user hapus "Terverifikasi")

**Update status (admin):**
- PATCH /api/admin/orders/:id/status {status}
- PATCH /api/admin/orders/:id/payment {status}
- Set tracking → otomatis order_status='shipped' + shipped_at
- Cancel (user): PATCH /api/orders/:id/cancel — hanya status pending/confirmed/processed (bukan shipped/delivered/cancelled) + **balikin stok**

### 3.6 Pengiriman & Tracking (Cek Resi)

**Alur:**
1. Admin set kurir + nomor resi (POST /api/admin/tracking/:orderId/set) → simpan courier + tracking_number di orders + auto order_status='shipped'
2. Poll status: GET /api/admin/tracking/:orderId/poll → fetch ke cek-resi API external → simpan ke tracking_history/tracking_logs
3. User lihat: GET /api/tracking/:orderId (authOptional — user pemilik order) → riwayat resi_status + tracking history

**Catatan:** ongkir = 0 di sistem; resi/tracking hanya informatif (belum ada biaya pengiriman aktual).

### 3.7 Voucher & Promo

**Admin** (kelola voucher):
- CRUD /api/admin/vouchers (list, create, update, delete)
- Type: **fixed** (Rp) atau **percent** (% dari subtotal, 0-100)
- Field: code, discount_amount, min_purchase, max_uses, is_active, expires_at

**User:**
- GET /api/vouchers → voucher AKTIF (tampil "Voucher Spesial Hari Ini" di CartPage)
- POST /api/vouchers/validate {code, subtotal} → validasi sebelum checkout
- Apply di checkout: voucherCode dikirim → BE verifikasi ulang + hitung diskon

**Sync promo:** CartPage fetch active vouchers dari BE (bukan hardcode) → tampil sinkron dengan yang dibuat admin.

### 3.8 Favorit (Wishlist)

- GET /api/wishlist → produk favorit user (+image_url primary)
- POST /api/wishlist/:productId → tambah (duplicate → no-op)
- DELETE /api/wishlist/:id → hapus
- FE: icon hati di ProductCard (toggle), halaman favorit di profil

### 3.9 Profil & Alamat (User)

**Profil (GET/PUT /api/user/profile):**
- Field: name, email, phone, gender, birth_date
- Phone: PhoneInput komponen (prefix +62 permanen, digit-only, sanitize 0/62 awal, max 13 digit) — dipakai di register, lupa password, profil, alamat, checkout → **sinkron format di semua form**
- Tanggal lahir: type="date" (calendar native)

**Alamat (CRUD /api/user/addresses):**
- GET list, POST create, PUT update, DELETE
- is_primary: alamat utama (prefill checkout)
- upsertPrimaryAddress helper (FE): get → find primary → create/update → **prefill form checkout otomatis** dengan alamat primary
- Kode pos: type="number" digit-only

**Change password (PUT /api/user/change-password):** cek old password → hash baru

### 3.10 Landing Page (Konten Beranda)

- GET /api/landing-content (public) → hero, story, benefits, featured (semua konten UI)
- PUT /api/landing-content (admin) → update konten
- Admin: "Pengaturan Landing Page" — hero text, banner, story, benefits, featured product, **upload gambar** (story image via productAdminApi.uploadImage)

### 3.11 Banner, Artikel, FAQ, Info

**Banner** (admin CRUD + user GET):
- is_active filter (nonaktif tidak tampil), sort_order
- Upload gambar banner via /api/admin/upload

**Artikel** (admin CRUD + user GET):
- Artikel + content_blocks (JSON: text/image/quote) + FAQ terpisah
- Endpoint: /api/articles (list), /api/articles/:slug (detail), /api/articles/faq/all (public FAQ)
- Admin: /api/admin/articles/* + /api/admin/articles/faq/* (JANGAN public)
- Upload gambar: hero + content blocks

**Kelola Info** = list artikel + FAQ (admin); form artikel di ArticleFormView

### 3.12 Panel Admin (Kelola)

| Nav | Fungsi |
|---|---|
| Dashboard | Statistik (order count, revenue, produk, user) |
| Pengaturan Landing | Hero/story/benefits/featured + upload |
| Kelola Produk | CRUD produk + gambar (multiple, set primary, upload/kompresi) + toggle aktif |
| Kelola Transaksi | List order + detail (item image, alamat, kurir/resi, tracking) + ubah status order & payment |
| Kelola Info | CRUD artikel (hero + content blocks + upload) |
| Kelola User | CRUD user + **soft delete** (is_deleted=1 — nonaktif, bukan hapus baris) |
| Kelola FAQ | CRUD FAQ |
| Kelola Voucher | CRUD voucher (fixed/percent + expires_at) |
| Kelola Lain | Badges + pengaturan toko (logo, QRIS, WA, dll) + upload logo/QRIS |

**Upload (POST /api/admin/upload):** multer, folder uploads/, max 8MB; FE kompresi imageCompress <1MB sebelum upload (lolos nginx limit). Balasan = URL /uploads/xxx.

### 3.13 Badges & Pengaturan Toko

- Badges: tabel badges + CRUD admin (badge = label produk: "BEST SELLER" dll)
- Site settings (site_settings key-value): store_name, logo, whatsapp, qris (image + nmid + status), dll
- Logo/QRIS: upload via handleLogoFileUpload/handleQrisFileUpload (compressImage + upload) + hapus via handleRemoveImage

---

## 4. PETA ENDPOINT LENGKAP

### Public
| Method | Path | Fungsi |
|---|---|---|
| POST | /api/auth/register | Daftar |
| POST | /api/auth/login | Login → JWT |
| POST | /api/auth/forgot-password | Kirim OTP WA |
| POST | /api/auth/reset-password | Reset pakai OTP |
| GET | /api/auth/me | Sesi valid? |
| GET | /api/products | List (filter/sort/search) |
| GET | /api/products/featured | Produk unggulan |
| GET | /api/products/:slug | Detail |
| GET | /api/categories | Kategori |
| GET | /api/cart | Cart (authOptional) |
| POST | /api/cart/add | Tambah item |
| PUT | /api/cart/:id | Ubah qty |
| DELETE | /api/cart/:id | Hapus item |
| POST | /api/cart/merge | Gabung cart guest→user |
| POST | /api/orders | Checkout |
| GET | /api/orders/mine | Order user |
| GET | /api/orders/:id | Detail order (owner) |
| PATCH | /api/orders/:id/cancel | Batal order (user) |
| GET | /api/tracking/:orderId | Status resi (owner) |
| GET | /api/banners | Banner aktif |
| GET | /api/articles | Artikel list |
| GET | /api/articles/:slug | Artikel detail |
| GET | /api/articles/faq/all | FAQ public |
| GET | /api/settings | Pengaturan toko |
| GET | /api/landing-content | Konten landing |
| GET | /api/vouchers | Voucher aktif |
| POST | /api/vouchers/validate | Validasi voucher |
| GET | /api/user/profile | Profil (auth) |
| PUT | /api/user/profile | Update profil |
| PUT | /api/user/change-password | Ganti password |
| GET/POST/PUT/DELETE | /api/user/addresses | CRUD alamat |
| GET/POST/DELETE | /api/wishlist | Favorit |

### Admin (semua authRequired + adminOnly)
| Method | Path | Fungsi |
|---|---|---|
| GET | /api/admin/dashboard | Statistik |
| GET/POST/PUT/DELETE | /api/admin/dashboard/users | CRUD user (soft delete) |
| GET/PUT | /api/admin/settings | Pengaturan toko |
| GET/POST/PUT/DELETE | /api/admin/products | CRUD produk |
| PATCH | /api/admin/products/:id/toggle-active | Aktif/nonaktif |
| POST | /api/admin/products/:id/images | Tambah gambar produk |
| PUT | /api/admin/products/:id/images/:imageId/primary | Set primary |
| DELETE | /api/admin/products/:id/images/:imageId | Hapus gambar |
| GET/POST/PUT/DELETE | /api/admin/categories | CRUD kategori |
| GET/POST/PUT/DELETE | /api/admin/banners | CRUD banner |
| GET/POST/PUT/DELETE | /api/admin/articles | CRUD artikel |
| GET/POST/PUT/DELETE | /api/admin/articles/faq | CRUD FAQ |
| GET | /api/admin/orders | List semua order |
| GET | /api/admin/orders/:id | Detail |
| PATCH | /api/admin/orders/:id/status | Ubah status order |
| PATCH | /api/admin/orders/:id/payment | Ubah status bayar |
| GET | /api/admin/tracking/:orderId | Status resi |
| POST | /api/admin/tracking/:orderId/set | Set kurir+resi |
| POST | /api/admin/tracking/:orderId/poll | Poll cek-resi |
| POST | /api/admin/upload | Upload 1 gambar |
| POST | /api/admin/upload/multiple | Upload banyak |
| GET/POST/PUT/DELETE | /api/admin/badges | CRUD badge |
| GET/POST/PUT/DELETE | /api/vouchers/admin | CRUD voucher (di voucher_routes) |

---

## 5. STATUS & KEPUTUSAN BISNIS KUNCI

1. **Ongkir = 0** (2026-08-07): ongkir dihapus dari perhitungan (UI + sistem). Total = subtotal - diskon. QRIS: bayar hanya harga barang, ongkir menyusul setelah admin konfirmasi.
2. **Status order longgar** (2026-08-06): admin bebas set semua status, kecuali terminal (delivered/cancelled) tidak bisa berubah.
3. **Status payment**: unpaid/paid (+confirmed di BE, tidak ditampilkan di FE).
4. **Soft delete user**: UPDATE is_deleted=1 (baris tetap ada), login ditolak "Akun dinonaktifkan".
5. **Idempotency checkout**: key unik per checkout → cegah double-submit.
6. **Snapshot order_items**: nama + gambar + harga produk di-copy saat order (COALESCE dengan product_images untuk gambar lama).
7. **Diskon voucher server-side**: client tidak pernah menentukan diskon.
8. **Cart server-authoritative**: localStorage hanya session id; data cart di DB.
9. **Upload**: kompresi client-side (<1MB) → upload /api/admin/upload → URL /uploads/xxx.
10. **Gambar upload serve**: symlink dist/uploads → backend/uploads (workaround sementara; fix permanen = nginx location /uploads → proxy 127.0.0.1:20203).

---

## 6. SKEMA DB (18 Tabel)

users (id, name, email, password_hash, phone, gender, birth_date, role, is_deleted, timestamps)
products (id, category_id, name, slug, description, price, original_price, discount_percent, stock, weight_spec, origin, is_active, is_featured, gluten_free, organic, badge, composition, shelf_life, attributes)
product_images (id, product_id, image_url, alt_text, is_primary, sort_order)
categories (id, name, slug, image_url, sort_order)
cart_items (id, user_id, session_id, owner_key, product_id, quantity, timestamps)
orders (id, order_number, idempotency_key, user_id, customer_*, shipping_address, notes, subtotal, shipping_cost, discount, total, payment_method, payment_status, order_status, courier, tracking_number, shipped_at, timestamps)
order_items (id, order_id, product_id, product_name, image_url, price, quantity, subtotal)
vouchers (id, code, discount_amount, min_purchase, max_uses, used_count, is_active, expires_at, type)
wishlists (id, user_id, product_id, timestamps)
user_addresses (id, user_id, label, recipient_name, phone, address, district, city, province, postal_code, is_primary)
banners (id, title, title_en, image_url, target_type, target_link, is_active, sort_order)
articles (id, title, slug, category, content, content_blocks, excerpt, image_url, is_published, published_at, author, author_role, read_time, sub_image, quote, facts)
faq (id, question, answer, sort_order, is_active)
landing_content (key, value JSON)
site_settings (setting_key, setting_value, updated_at)
badges (id, name, description, ...)
password_reset_tokens (id, user_id, token, expires_at)
tracking_history + tracking_logs (status resi + log cek-resi)

---

## 7. ALUR END-TO-END (USER JOURNEY)

**Guest → Beli (COD):**
Beranda → PRODUK → search/filter → klik produk (login dulu) → add cart → keranjang → checkout (form alamat prefill dari primary) → pilih COD → order dibuat (BE: idempotency → voucher → insert order+items → stok- → clear cart → WA link) → halaman sukses → "Konfirmasi ke Admin via WhatsApp" → admin proses → set kurir+resi (auto shipped) → user cek tracking

**Guest → Beli (QRIS):**
... sampai checkout → pilih QRIS → order dibuat → halaman QRIS (gambar dinamis) → scan + bayar → (tanpa button WA konfirmasi) → admin verifikasi payment (Belum Bayar → Sudah Bayar) → proses pengiriman

**Admin daily:**
Login admin → Dashboard (revenue/orders) → Kelola Transaksi (ubah status, verifikasi bayar, set resi) → Kelola Produk (update stok/harga/gambar) → Kelola Voucher (buat promo persen) → Kelola User (soft delete) → Kelola Info (artikel/FAQ) → Pengaturan (logo/QRIS/WA)
