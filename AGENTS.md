# AGENTS.md — BESTARI E-Catalog Sorgum

Sorgum e-commerce: React 19 + Vite 6 + Tailwind 4 (`src/`) + Express 5 + TypeScript `commonjs` (`backend/src/`) + MySQL 8 raw `mysql2` (no ORM/Zod). Single-app tab-state (not routes), admin + shop in one. Remote: `ameliawaruwu/Project-Bestari-Modul-E-Catalog-Sorgum-`.

## Stack & Entrypoints

- **FE** `src/` alias `@` → repo root (`vite.config.ts`). `src/api/http.ts` is the only fetch wrapper; `src/context/AppContext.tsx` holds all global state.
- **BE** `backend/src/index.ts` mounts everything: `/api/auth`, `/api/products`, `/api/categories`, `/api/cart`, `/api/orders` (checkout), `/api/tracking`, `/api/banners`, `/api/articles`, `/api/settings`, `/api/landing-content`, `/api/user`, `/api/wishlist`, `/api/vouchers`, `/api/admin/*`, `/api/events` (SSE), `/api/health`. Static `/uploads` from `ECATALOG_BESTARI_UPLOAD_DIR`. Requires `trust proxy: 1` for `express-rate-limit` behind nginx.
- **DB** `ecatalog_bestari_db`, 20 migrations `backend/src/migrations/001_*.sql` → `020_*.sql`. Legacy runner `backend/migrate.cjs` still works but new migrations must be SQL files.

## Commands (exact)

- **FE**: `npm run dev` → `:3000` (proxy `/api`+`/uploads` → `localhost:20203`); `npm run build` → `dist/` + `postbuild` symlink `dist/uploads → backend/uploads_ecatalog_bestari` (workaround until nginx `location /uploads` is fixed, `emptyOutDir` deletes it); `npm run lint` = `tsc --noEmit`; `npm run i18n:extract` → regen `src/locales/id.ts`+`en.ts`.
- **BE**: `cd backend && npm run dev` = `nodemon --exec tsx src/index.ts` → `:20203`; `npm run build` (`tsc` → `dist/`); `npm start` (`node dist/index.js`); `npm run db:migrate` (`node migrate.cjs`); `npm test` (`vitest run`); typecheck `npx tsc --noEmit`.
- **Verify order**: `npx tsc --noEmit` (root) + `cd backend && npx tsc --noEmit` + `npm run build` — required before any PR/handoff. No ESLint/Prettier/Biome configs exist.

## Dev Env & Config

- **Node 20+**, MySQL 8. Local BE runs via **PM2 `bestari-be` (id 0)** — check `pm2 list` first; after BE edits `pm2 restart bestari-be`, never `npx tsx` in parallel (port clash). Port `3001` = cek-resi-v2 (don't touch). Prod: `e-catalog.kolab.top` (nginx serves `dist/`), BE `bestari-be` — keep `bestari-backend` (community app) untouched. Prod SSH `minibox@100.90.80.95`.
- **Env**: `backend/.env` (`ECATALOG_BESTARI_*` — see `backend/.env.example`: `DB_*`, `JWT_SECRET` (fatal if empty), `PORT=20203`, `UPLOAD_DIR`, `MAX_FILE_SIZE` default `1048576` = 1 MB, `CORS_ORIGINS`, `ADMIN_WA`, `GOWA_WEBHOOK_URL`, `OTP_TTL_MINUTES=5`, `TRACKING_POLL_HOURS=4`). Root `.env` is Gemini only (`GEMINI_API_KEY`, `APP_URL`) — not app config. Never echo secrets to chat/commit; local DB pass: `grep ECATALOG_BESTARI_DB_PASSWORD backend/.env | cut -d= -f2`.
- **Vite**: `DISABLE_HMR=true` disables HMR + file watch (AI Studio). `resolve.alias @` → `path.resolve(__dirname,'.')`.

## Conventions

- **BE**: `routes → services → raw SQL` (`mysql2/promise`). Errors via `AppError` + central handler in `index.ts` (prod hides raw SQL/stack). Auth: `authRequired`/`adminOnly`/`authOptional` in `backend/src/middleware/auth.ts`; rate-limit on auth via `middleware/rate_limit.ts`. Env config: `backend/src/lib/config.ts` loads `dotenv` + parses all `ECATALOG_BESTARI_*` (CORS split by comma, upload limit, JWT `expiresIn`). `express.json({limit:'10mb'})` for base64 QRIS/logo, but BE `maxFileSize` 1 MB + nginx `client_max_body_size` 1 MB still enforce upload cap. `Cache-Control: no-store` on all `/api` + SSE before 404.
- **FE**: All API via `src/api/*.ts` through `http.ts`: `API_BASE='/api'`, header `x-session-id` always sent (guest `bestari_guest_session` auto-generated), token stored under **misleading key `bestari_session_id`** (not guest!), `bestari_current_user` = cached user JSON. Auto-retry 2× (800/1600 ms) + 45 s timeout only on connection failures (not HTTP 4xx/5xx), emits `app:connection-error`/`app:connection-restored`. Auth flow uses generation counter + `storage` event for multi-tab sync; cart is server-authoritative (`cart_items` by `user_id`/`session_id`), merged on login via `POST /cart/merge` fire-and-forget.
- **i18n**: UI copy via `t('id text','en text')` → `tools/extract-i18n.mjs` slugifies ID text to key (max 60 chars) → `src/locales/{id,en}.ts` (`.ts` not `.json` — Vite 6 ESM bug). Must run `npm run i18n:extract` after adding any `t()` pair; keep `id.ts`/`en.ts` in sync (currently 205 keys each). Single source `i18n.language`, fallback `id`. Prices `Rp X.XXX` (`id-ID`), titles use "SORGUM".
- **Uploads**: FE compresses via `src/utils/imageCompress.ts` to <1 MB before upload; BE `multer` + nginx both reject >1 MB.

## UI Rules (`aturan-ui.md` — absolute)

Do not change `bestari_*` localStorage keys, API contract (`primary_image`, `order_status`), DB schema, or show internal product/order IDs. Keep: heart in category row (not product card), cards without eye icon / `-X%` badge (strikethrough price stays), qty `+/-` not free input, Kelola Produk table 6 cols `id DESC` no horizontal scroll, favorite button color on detail. Palette `#162809/#2b3e1d/#f9f3ec/#c4c8bc/#fade88`, fonts Plus Jakarta Sans + JetBrains Mono, Material Symbols Outlined only. No new fonts/libs without discussion.

## Pitfalls

- **PM2 vs manual**: local BE is PM2 — `pm2 restart bestari-be` after edits; don't `npx tsx src/index.ts` alongside it. Vite on `:3002` means `:3000` still occupied (`ss -tlnp | grep ':3000'` → kill).
- **Upload 1 MB**: nginx `client_max_body_size` and `ECATALOG_BESTARI_MAX_FILE_SIZE` both 1 MB; if upload fails in prod check nginx first. Large settings JSON (base64 QRIS/logo) needs `express.json 10mb` — don't lower.
- **Migrations**: new work = SQL file in `backend/src/migrations/NNN_*.sql`; run `mysql < file` or `node migrate.cjs` locally, SQL **before** PM2 restart in prod. `migrate.cjs` strips `DELIMITER`/procedures — use simple DDL when possible.
- **Rate limiter**: auth endpoints 20 req/15 min/IP — `apiLogin()` via `localStorage` injection in E2E, never loop UI logins; check `RateLimit-Remaining` header on 429.
- **Build artifacts**: `dist/` wiped on `vite build` — `postbuild` symlink must re-run; FE+B `tsx`/`vite` not in `tsconfig` exclude? `tsconfig.json` excludes `backend`/`tests`/`tools`/`dist`.
- **Git ignore**: `tools/`, `tests/`, `.omo/`, `.hermes/`, `assets/.aistudio/*` are ignored — QA scripts there are not committed. `test_suite/` (mod_*.cjs + results_*.json QA runs) is NOT in `.gitignore` — keep it untracked or add to ignore.
- **Stale `.env.example`**: `backend/.env.example` still ships `ECATALOG_BESTARI_MAX_FILE_SIZE=5242880` (5 MB) but runtime default in `backend/src/lib/config.ts` is `1048576` (1 MB) — trust the code, not the example.
- **Secrets**: never `cat`/`grep` `.env` values into chat or commits; use for connection only.
- **Verification**: `JANGAN` run browser/E2E/curl without explicit user permission; always `tsc` FE+BE first.
