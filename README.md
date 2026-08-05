# BESTARI - Sorgum E-Catalog

Frontend React (Vite) + Backend Express (TypeScript) untuk E-Catalog produk sorgum BESTARI.

## Struktur

```
Project-Bestari-Modul-E-Catalog-Sorgum-/
├── src/                  # Frontend React (Vite)
│   ├── api/              # API client — semua panggilan backend di sini
│   │   ├── http.ts       # fetch helper (token, x-session-id, error)
│   │   ├── productApi.ts # produk
│   │   ├── authApi.ts    # register/login/me/logout
│   │   ├── orderApi.ts   # cart & order (server-side)
│   │   ├── articleApi.ts # artikel
│   │   ├── faqApi.ts     # FAQ
│   │   ├── shopSettingsApi.ts # pengaturan toko (nama, WA, QRIS)
│   │   └── adminApi.ts   # CRUD admin (produk, artikel)
│   ├── pages/            # Halaman (Home, Products, Checkout, Admin, dll)
│   ├── components/       # Komponen UI
│   ├── context/          # AppContext (bahasa, tema)
│   └── types/            # TypeScript types (kontrak FE)
└── backend/              # Backend Express (copy dari BESTARI_Backend)
    ├── src/
    │   ├── index.ts      # entry — semua route mount
    │   ├── routes/       # auth, products, cart, orders, articles, faq, settings, admin/*
    │   ├── services/     # logika DB (raw SQL)
    │   ├── middleware/   # auth, rate-limit
    │   └── migrations/   # 001_init.sql (schema) + 002_align_fe_contract.sql
    └── .env              # config (ECATALOG_BESTARI_*)
```

## Prasyarat

- Node.js 20+
- MySQL 8 (database `ecatalog_bestari_db`)

## Setup

1. **Database** (sekali):
   ```bash
   cd backend
   mysql -u root -p < src/migrations/001_init.sql   # buat schema + seed
   mysql -u root -p < src/migrations/002_align_fe_contract.sql  # tambah kolom FE contract
   ```

2. **Backend** (terminal 1):
   ```bash
   cd backend
   cp .env.example .env   # isi kredensial DB & JWT secret
   npm install
   npx tsx src/index.ts   # jalan di port 20203
   ```

3. **Frontend** (terminal 2):
   ```bash
   npm install
   npm run dev            # jalan di port 3000
   ```

Vite proxy mengarahkan `/api` → `http://localhost:20203`, jadi FE & BE nyambung tanpa CORS.

## Akun Admin

- Email: `admin@bestari.id`
- Password: `admin123` (hash bcrypt diset di migration 002 — ganti sebelum produksi!)

## Catatan

- Cart server-side: guest pakai `x-session-id` (auto-generate di localStorage), merge otomatis saat login.
- Checkout: `POST /api/orders` → buat order di DB + generate WA link ke admin (nomor dari `ECATALOG_BESTARI_ADMIN_WA`).
- Tracking pakai cek-resi (Hono, port 3000) — jangan jalan bareng FE dev di port yang sama.
- Backend pakai raw SQL (mysql2) — no ORM, no Zod.
