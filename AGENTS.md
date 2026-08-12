# AGENTS.md — BESTARI E-Catalog Sorgum

E-commerce sorgum: React 19 + Vite 6 frontend (`src/`) + Express 5 + TypeScript backend (`backend/`) + MySQL raw SQL. Admin panel + toko user dalam satu app, tab-state (bukan multi-route). Git remote: `ameliawaruwu/Project-Bestari-Modul-E-Catalog-Sorgum-`.

## Dev environment

- **Node 20+**, MySQL 8, DB `ecatalog_bestari_db` (lokal & prod).
- **Backend**: `cd backend && npx tsx src/index.ts` → port **20203**. Local BE dijalankan via **PM2 `bestari-be`** (id 0) — jangan start manual bersamaan, cek `pm2 list` dulu.
- **Frontend**: `npm run dev` → port **3000**. Vite proxy: `/api` & `/uploads` → `http://localhost:20203` (`vite.config.ts`).
- **Port 3001** = cek-resi-v2 (service lain, jangan disentuh). **Prod**: FE static dist via nginx `e-catalog.kolab.top`; BE `bestari-be` id 8; `bestari-backend` id 18 = community-app (JANGAN sentuh). Prod SSH: `minibox@100.90.80.95`.
- Env: `backend/.env` (ECATALOG_BESTARI_*). Root `.env` hanya AI Studio (GEMINI_API_KEY, APP_URL) — jangan dipakai untuk config app.
- DB password lokal: `PWD_DB=$(grep ECATALOG_BESTARI_DB_PASSWORD backend/.env | cut -d= -f2)`; prod: `mysql -u root` tanpa password. JANGAN tulis nilai secret ke chat/commit.

## Build & test

- **Lint/typecheck FE**: `npx tsc --noEmit` (root). **Lint/typecheck BE**: `cd backend && npx tsc --noEmit`.
- **Build FE**: `npm run build` → `dist/`. **Build BE**: `cd backend && npm run build` (tsc → dist/).
- **i18n**: `npm run i18n:extract` → regenerate `src/locales/id.ts` + `en.ts`. Wajib jalan setelah menambah string `t()` baru; kamus harus tetap sinkron 192=192 keys.
- **Migrasi DB**: `cd backend && node migrate.cjs` (runner utk kolom legacy) ATAU jalankan `backend/src/migrations/NNN_*.sql` langsung ke mysql (pola terbaru: 017, 018). Migrasi prod: jalankan SQL **sebelum** restart PM2.
- **E2E**: `node tests/e2e/flow-*.spec.cjs` (Playwright, helper `tests/e2e/helpers.cjs`). Perlu FE dev di :3000 + BE di :20203. Auth rate-limiter 20 req/15mnt/IP — login via `apiLogin()` (inject localStorage), jangan via UI berulang.
- **Verifikasi Wajib**: tsc FE + BE + build. JANGAN jalankan test browser/E2E/curl tanpa izin eksplisit user.

## Conventions

- **BE**: routes → services → raw SQL mysql2 (no ORM, no Zod). Error via `AppError` + middleware di `index.ts`. Auth: `authRequired` / `adminOnly` di `middleware/auth.ts`. Mount semua route di `backend/src/index.ts` (`/api/...`, `/api/admin/...`, `/uploads` static).
- **FE**: semua panggilan API lewat `src/api/*.ts` (http.ts wrapper: token, `x-session-id`, ApiError). Copy UI via `t()` dari i18next — **jangan hardcode teks baru**; single source `i18n.language`. Navigasi = tab-state (activeTab), bukan URL routes.
- **UI rules** (`aturan-ui.md`): jangan ubah localStorage keys `bestari_*`, API contract (`primary_image`, `order_status`), schema DB. Hati di baris kategori, card TANPA ikon mata/badge -X% (harga coret tetap), tabel Kelola Produk 6 kolom id DESC tanpa scroll, ID produk tidak tampil di UI, palet `#162809/#2b3e1d/#f9f3ec/#c4c8bc/#fade88`, font Plus Jakarta Sans + JetBrains Mono, ikon Material Symbols.
- **Admin API**: panel fetch `/api/admin/*` ke state sendiri; admin FAQ endpoint `/admin/articles/faq` (jangan public); `LIST_SELECT` kategori wajib `p.description`; mysql2 JSON col kadang objek.
- **Commit style**: `feat:` / `fix:` / `refactor:` / `merge:` + deskripsi singkat (lihat git log). JANGAN commit/push/deploy tanpa perintah eksplisit user.
- **Kode**: KISS/YAGNI/DRY — pahami dulu, reuse, perubahan sekecil mungkin.

## Pitfalls

- **BE lokal = PM2** (`bestari-be` id 0). Kalau edit BE, `pm2 restart bestari-be` — jangan start `npx tsx` sendiri (port clash + duplikasi instance).
- **Port 3002**: kalau `npm run dev` jatuh ke 3002, ada vite lain di :3000 — cek `ss -tlnp | grep ':3000'` dan kill. Selalu matikan vite test setelah selesai.
- **Prod nginx `client_max_body_size` default 1MB** — upload >1MB ditolak; FE kompres gambar (`src/utils/imageCompress.ts`) sebelum upload. Kalau upload gagal di prod, cek ini dulu.
- **Migrasi baru wajib SQL file** di `backend/src/migrations/` (pola terbaru 017/018), jangan cuma runner legacy.
- **Rate limiter auth**: request API berulang (login/register) kena 429 — pakai header `RateLimit-Remaining` & jeda.
- **tools/** & **tests/** di-ignore git — script QA jangan di-commit.
- **execute_code sandbox** sering 500 transient di request pertama — pakai curl untuk operasi stabil.
- **Jangan pernah** grep/baca nilai secret dari `.env` untuk ditulis ulang; hanya pakai untuk koneksi.
