# Tracking: Akalin Pengirim & Tujuan (fallback dari data order)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Tampilkan "Pengirim" dan "Tujuan" di UI tracking yang selama ini kosong (cekresi.com selalu return `"--"`), dengan fallback ke data order yang sudah ada: kurir yang di-set admin jadi pengirim, alamat checkout user jadi tujuan, dan update terakhir dari riwayat pengiriman.

**Architecture:** Tanpa ubah data API — cukup pakai data yang SUDAH ada di BE. `GET /api/tracking/:orderId` sekarang return `{tracking: {courier, tracking_number, resi_status, pengirim, tujuan, checked_at}, history: [...]}`. Yang kita ubah cuma di service layer: kalau `pengirim`/`tujuan` dari cekresi kosong/`"--"`, ganti dengan nilai fallback dari `orders` (courier + alamat). Update terakhir pakai event terakhir dari `history`. FE gak berubah sama sekali (field-nya sudah ada dan di-render).

**Tech Stack:** Express + TypeScript (backend), React (FE tidak berubah), MySQL (read-only query tambahan).

---

## Konteks & Asumsi

- cekresi.com TIDAK pernah nyediain `pengirim`/`tujuan` (selalu `"--"` di raw response — verified di DB order 8, JNE & Shopee Express).
- Data yang tersedia di BE untuk fallback:
  - `orders.courier` — kurir yang di-set admin (mis. "JNE", "Shopee")
  - `orders.shipping_address` — JSON `{recipient_name, phone, address_line, district, city, province, postal_code}` (dari checkout)
  - `tracking_history` — timeline; event terakhir (urutan `created_at ASC`, yang terakhir = terbaru) = "update terakhir"
- `getTrackingHistory(orderId)` (tracking_service.ts:94-110) udah return `history` dari `tracking_history` dan `tracking` dari `tracking_logs` — kita tambahin fallback di sini tanpa ubah signature.
- FE `OrdersPage.tsx` render `tk.pengirim || '-'`, `tk.tujuan || '-'`, `tk.checked_at` — dengan fallback BE, field ini keisi real, FE gak perlu disentuh.
- TIDAK perlu migrate DB, TIDAK perlu ubah FE, TIDAK perlu ubah route.

## File yang Berubah

- Modify: `backend/src/services/tracking_service.ts` — `getTrackingHistory()` tambah fallback (1 fungsi, ~20 baris)
- TIDAK berubah: `backend/src/routes/tracking_routes.ts`, `src/pages/OrdersPage.tsx`, `src/api/orderApi.ts`, DB

---

## Task 0: FE — currentUser jangan render dari localStorage cache (sesi admin/user lama nyangkut)

**Objective:** Saat login user (bukan admin), UI gak boleh render "sebagai admin" walau localStorage masih nyimpen cache admin dari sesi sebelumnya. Root cause: `AppContext` init state `currentUser` LANGSUNG dari `localStorage` (AppContext.tsx:562-565) → render flash admin dulu, baru hydrate `/auth/me` koreksi. Fix: init dari BE, jangan dari cache.

**Files:**
- Modify: `src/context/AppContext.tsx:562-565` (init `currentUser` state)
- Modify: `src/context/AppContext.tsx:577-585` (hydrate effect)

**Step 1: Pahami bug (2 lapis cache)**

- Lapis 1 (SUDAH di-fix): `authApi.getCurrentUser()` — kalau token ada tapi `/auth/me` gagal, JANGAN return cache (authApi.ts:93-103). ✅
- Lapis 2 (BELUM di-fix, ini bugnya): `useState(() => localStorage.getItem('bestari_current_user'))` (AppContext.tsx:563-565) — render PERTAMA baca cache mentah. Kalau cache isi `{role:'admin'}` dari sesi lama, UI render admin dulu; hydrate `/auth/me` baru koreksi → kelihatan "session admin kesisa pas login user".

**Step 2: Init state kosong, bukan dari cache**

```tsx
// AppContext.tsx:562-565 — ganti:
const [currentUser, setCurrentUser] = useState<User | null>(() => {
  const raw = localStorage.getItem('bestari_current_user');
  return raw ? JSON.parse(raw) : null;
});
// jadi:
const [currentUser, setCurrentUser] = useState<User | null>(null);
```

**Step 3: Hydrate effect set dari BE (sudah ada, pastikan jalan)**

Effect di AppContext.tsx:577-585 sudah benar — `authApi.getCurrentUser()` fetch `/auth/me` (kalau token ada), dan `getCurrentUser` SUDAH bersihin cache kalau token invalid. Dengan init `null`, UI gak pernah render cache basi. Tapi PERLU TAMBAH: kalau `getCurrentUser` return null (gak ada token / token invalid), cache `bestari_current_user` HARUS dihapus juga (biar gak nyangkut ke render berikutnya):

```tsx
authApi.getCurrentUser().then((fresh) => {
  if (!cancelled) setCurrentUser(fresh);
  if (!fresh) {
    try { localStorage.removeItem('bestari_current_user'); } catch { /* ignore */ }
  }
});
```

**Step 4: Login handler — sudah bener, verifikasi doang**

`AppContext.login` (AppContext.tsx:731-741) & `authApi.login` (authApi.ts:67-69) SUDAH overwrite `bestari_current_user` + token dengan user baru. Gak perlu ubah. Yang bikin masalah cuma render awal dari cache.

**Step 5: Verifikasi manual**

1. Login admin → logout.
2. Tanpa refresh browser, buka tab baru / refresh → login user biasa.
3. Expected: UI langsung tampil sebagai user (bukan flash admin). 
4. Cek localStorage: `bestari_current_user` isi `{"role":"user"...}` — bukan admin.
5. Edge: hard-refresh halaman → hydrate dari BE → user (bukan admin).

**Step 6: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "fix(auth): init currentUser dari BE bukan localStorage — cegah sesi admin lama nyangkut pas login user"
```

⚠️ Catatan implementer: jangan ubah `authApi.getCurrentUser` (sudah di-fix), jangan ubah `AppContext.login` (sudah bener), jangan sentuh role-lock `App.tsx handleTabChange` (sudah ada). Fix cuma init state + guard cleanup.

---

## Task 1: Fallback pengirim (courier) & tujuan (alamat order) di getTrackingHistory

**Objective:** Kalau cekresi balikin `"--"`/null untuk pengirim/tujuan, isi dari data order (kurir + alamat checkout).

**Files:**
- Modify: `backend/src/services/tracking_service.ts:94-110` (fungsi `getTrackingHistory`)

**Step 1: Pahami query yang ada**

Query `tracking` saat ini hanya SELECT dari `tracking_logs`:

```ts
const [latest] = await dbPool.query(
  `SELECT courier, tracking_number, resi_status, pengirim, tujuan, checked_at
   FROM tracking_logs WHERE order_id = ? ORDER BY checked_at DESC LIMIT 1`,
  [orderId],
);
```

**Step 2: Tambah query alamat order + tulis fallback**

Tambahkan setelah query `latest` (sebelum `return`):

```ts
// cekresi.com gak pernah nyediain pengirim/tujuan (selalu "--")
// fallback: kurir admin = pengirim, alamat checkout = tujuan
const track = (latest as any[])[0] || null;
if (track) {
  const empty = (v: unknown) => v == null || v === '--' || v === '';
  if (empty(track.pengirim)) {
    const [orderRows] = await dbPool.query(
      `SELECT courier, shipping_address FROM orders WHERE id = ?`,
      [orderId],
    );
    const order = (orderRows as any[])[0];
    if (order) {
      track.pengirim = order.courier || null;
      let addr = order.shipping_address;
      try { addr = typeof addr === 'string' ? JSON.parse(addr) : addr; } catch { addr = null; }
      if (empty(track.tujuan)) {
        track.tujuan = addr
          ? [addr.recipient_name, addr.address_line, addr.district, addr.city, addr.province, addr.postal_code]
              .filter((v: unknown) => v && String(v).trim() !== '')
              .join(', ') || null
          : null;
      }
    }
  }
}
```

Catatan: `tujuan` fallback = alamat lengkap (nama penerima + alamat + kota + provinsi). Pengirim = nama kurir (e.g. "JNE"), bukan "JNE Express" biar konsisten sama yang user lihat di badge order.

**Step 3: Return pakai `track` yang sudah di-fallback**

Ganti baris return:

```ts
return {
  tracking: track,
  history: history as { event_date: string; description: string }[],
};
```

(sebelumnya `tracking: (latest as any[])[0] || null`)

**Step 4: Verifikasi tipe (tsc)**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors (tidak ada error baru).

**Step 5: Test manual via curl**

1. Restart BE: `pm2 restart bestari-be`
2. Run: `curl -s http://localhost:20203/api/tracking/8 | python3 -m json.tool`
3. Expected: `"pengirim": "JNE"` (atau kurir terakhir di order 8 — bisa "Shopee"), `"tujuan": "..., Kota ..., ..., ..."` (isi dari shipping_address), `"resi_status": "Delivered"`, `history` tetap ada.

**Step 6: Commit**

```bash
git add backend/src/services/tracking_service.ts
git commit -m "feat(tracking): fallback pengirim=kurir & tujuan=alamat order saat cekresi kosong"
```

---

## Task 2: Update terakhir = event terakhir riwayat pengiriman

**Objective:** "Update Terakhir" di UI bukan `checked_at` (waktu poll), tapi tanggal event terakhir dari riwayat — lebih informatif buat user.

**Files:**
- Modify: `backend/src/services/tracking_service.ts` (dalam `getTrackingHistory`, setelah fallback Task 1)

**Step 1: Tambah fallback checked_at dari history**

Setelah blok fallback Task 1 (masih dalam fungsi), sebelum `return`:

```ts
if (track && (!track.checked_at) && history.length > 0) {
  // event terakhir = index history.length - 1 (ASC order, terakhir = terbaru)
  track.checked_at = (history[history.length - 1] as any)?.event_date || null;
}
```

Catatan: `history` dari query `ORDER BY created_at ASC` → elemen terakhir = event paling baru → itu yang jadi "update terakhir".

**Step 2: Verifikasi tipe**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors.

**Step 3: Test manual**

Run: `curl -s http://localhost:20203/api/tracking/8 | python3 -m json.tool`
Expected: `"checked_at"` berisi tanggal event terakhir (mis. `29/07/2026 18:14`), bukan timestamp poll (`2026-08-04T08:10:09.000Z`). UI render `new Date(...).toLocaleString('id-ID')` — tanggal `29/07/2026 18:14` bakal tampil.

⚠️ NOTE (open question): format `event_date` = `"29/07/2026 18:14"` (DD/MM/YYYY) — `new Date("29/07/2026 18:14")` di JS **invalid** (parsing ambiguous). Lihat "Risiko & Open Questions" — kemungkinan perlu normalize tanggal dulu di FE atau kirim ISO. Task ini bakal diverifikasi saat implement.

**Step 4: Commit**

```bash
git add backend/src/services/tracking_service.ts
git commit -m "feat(tracking): update terakhir pakai event terakhir riwayat pengiriman"
```

---

## Task 3: Normalize tanggal event biar `new Date()` FE gak NaN

**Objective:** `event_date` dari cekresi format `DD/MM/YYYY HH:mm` — `new Date()` di FE return Invalid Date. Normalize ke format yang bisa di-parse (atau fallback render string mentah).

**Files:**
- Modify: `backend/src/services/tracking_service.ts` (normalize di query `history` — 1 helper kecil, DRY)
- Modify: `src/pages/OrdersPage.tsx:225` (fallback render tanggal mentah kalau parse gagal)

**Step 1: Helper normalize di BE**

Tambah di `tracking_service.ts` (luar fungsi, dekat constant lain):

```ts
// cekresi pakai format DD/MM/YYYY HH:mm — JS Date gak bisa parse; ubah ke ISO utk FE
function normalizeEventDate(d: string | null | undefined): string | null {
  if (!d || d === '-' || d === '') return null;
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) return d; // bukan format yang kita kenal — biarin apa adanya
  const [_, dd, mm, yyyy, hh, min] = m;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}${hh ? `T${hh.padStart(2, '0')}:${min}:00` : ''}`;
}
```

Pakai di query history (ubah SELECT):

```sql
SELECT event_date, description FROM tracking_history WHERE order_id = ? ORDER BY created_at ASC
```

→ tetap, tapi map hasil: `history = (history as any[]).map(h => ({ ...h, event_date: normalizeEventDate(h.event_date) }))`

Dan di fallback Task 2, `track.checked_at` ambil dari history yang SUDAH di-normalize (kalau null, fallback `checked_at` asli).

**Step 2: FE fallback render (biar aman)**

`OrdersPage.tsx:225`:

```tsx
{tk.checked_at ? new Date(tk.checked_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
```

→ ganti jadi helper inline yang fallback ke string mentah kalau parse gagal:

```tsx
{(() => {
  const d = new Date(tk.checked_at);
  const ok = !isNaN(d.getTime());
  return ok ? d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : tk.checked_at;
})()}
```

⚠️ Minimal-change: kalau Task 3 BE udah normalize ke ISO, FE render normal; fallback ini cuma jaring pengaman.

**Step 3: Verifikasi**

Run: `cd backend && npx tsc --noEmit` (0 errors) + `curl -s http://localhost:20203/api/tracking/8 | python3 -m json.tool` → `checked_at` & `history[].event_date` format `YYYY-MM-DD` / `YYYY-MM-DDTHH:mm:ss`.

**Step 4: Commit**

```bash
git add backend/src/services/tracking_service.ts src/pages/OrdersPage.tsx
git commit -m "fix(tracking): normalize event_date ke ISO biar FE gak render Invalid Date"
```

---

## Task 4: Verifikasi E2E (UI)

**Objective:** Pastikan di browser user, section tracking di OrdersPage nampilin Pengirim (kurir), Tujuan (alamat), dan Update Terakhir (event terakhir) yang keisi — bukan dash.

**Files:**
- Test: manual / Playwright `scripts/order-flow-e2e.py` (kalau mau re-run)

**Step 1: Restart BE & pastikan data**

Run: `pm2 restart bestari-be`
Run: `curl -s http://localhost:20203/api/tracking/8 | python3 -m json.tool`
Expected: `pengirim` = "JNE"/"Shopee", `tujuan` = alamat lengkap, `checked_at` = ISO event terakhir.

**Step 2: Buka UI**

Login user yang punya order id 8 (atau order lain yang udah di-set tracking), buka "Pesanan Saya" → card order → section "Riwayat Pengiriman".
Expected:
- Pengirim: JNE (bukan "-")
- Tujuan: alamat checkout (bukan "-")
- Update Terakhir: tanggal event terakhir (bukan waktu poll)
- Timeline tetap tampil.

**Step 3: Regression check cepat**

Run: `curl -s http://localhost:20203/api/health` → `{"status":"ok"}`. Cek gak ada error di `pm2 logs bestari-be --lines 20`.

---

## Risiko, Tradeoff, Open Questions

1. **`new Date("29/07/2026 18:14")` = Invalid Date di JS** — format cekresi `DD/MM/YYYY` ambigu. Task 3 normalize ke ISO di BE. Kalau implementer mau skip Task 3, FE fallback render string mentah tetap aman (Task 3 step 2).
2. **Order tanpa courier/alamat** (order guest lama tanpa shipping_address lengkap) → fallback null → UI tampil "-" (sama seperti sekarang, gak lebih buruk).
3. **Data cekresi valid (jarang, tapi bisa)** → fallback gak kepake; `pengirim`/`tujuan` asli dari cekresi dipakai. Logika `empty()` handle ini.
4. **Order 8 punya 2 tracking log (JNE lama + Shopee baru)** — query `latest` ambil yang terbaru (Shopee). Fallback pakai `orders.courier` = Shopee (yang paling baru di-set). Konsisten.
5. **`history` event_date normalize** — kalau event punya format lain (mis. `27/07/2026 09:32`), regex handle; kalau bukan format DD/MM/YYYY, string dibiarin apa adanya.
6. **Test data** — jangan commit test data; cleanup test orders kalau bikin yang baru.

## Verification Summary (jalankan berurutan)

```
cd backend && npx tsc --noEmit                      # Task 1,2,3 — 0 errors
pm2 restart bestari-be
curl -s http://localhost:20203/api/tracking/8 | python3 -m json.tool   # pengirim/tujuan/checked_at keisi
# UI: Pesanan Saya → Riwayat Pengiriman → Pengirim/Tujuan/Update Terakhir keisi
```
