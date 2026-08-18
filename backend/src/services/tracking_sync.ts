import dbPool from '../lib/db';
import { fetchTrackingStatus } from './tracking_service';

// ─── Auto-sync status pengiriman (E3-3 / I2-4) ────────────────────────────
// Latar belakang: admin set nomor resi → order_status = 'shipped'. Tapi kalau
// paket sudah sampai (cekresi: "DELIVERED") dan tidak ada yang klik "poll" di
// panel admin, status Bestari selamanya 'shipped' — user lihat "Dikirim"
// padahal barang sudah sampai (keluhan user 2026-08-18).
// Fix: scheduler poll berkala SEMUA order berstatus 'shipped' yang punya
// nomor resi. fetchTrackingStatus() sudah otomatis update order_status →
// 'delivered' kalau status cekresi mengandung "DELIVER" (case-insensitive).
// KISS: interval 30 menit; tiap run poll semua order shipped sekaligus.

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 menit
const MAX_PARALLEL = 3; // jangan banjiri API cekresi — poll bertahap

export function startTrackingSync(): NodeJS.Timeout {
  console.log('[TrackingSync] auto-sync status pengiriman aktif (interval 30 menit)');
  const run = async () => {
    try {
      const [rows] = await dbPool.query(
        `SELECT id, courier, tracking_number FROM orders
         WHERE order_status = 'shipped' AND tracking_number IS NOT NULL AND tracking_number != ''
         ORDER BY id DESC LIMIT 50`
      );
      const orders = rows as { id: number; courier: string; tracking_number: string }[];
      if (orders.length === 0) return;
      console.log(`[TrackingSync] poll ${orders.length} pesanan berstatus shipped...`);

      // Poll bertahap (MAX_PARALLEL sekaligus) — jangan banjiri cekresi
      for (let i = 0; i < orders.length; i += MAX_PARALLEL) {
        const batch = orders.slice(i, i + MAX_PARALLEL);
        await Promise.all(
          batch.map(async (o) => {
            try {
              const res = await fetchTrackingStatus(o.id, o.courier, o.tracking_number);
              if (res.isValid && res.status && String(res.status).toUpperCase().includes('DELIVER')) {
                console.log(`[TrackingSync] order #${o.id} → DELIVERED (auto-update)`);
              }
            } catch (e: any) {
              // Abaikan per-order error (cekresi down / resi invalid) — jangan
              // matikan siklus. Order tetap 'shipped'; admin bisa poll manual.
              console.warn(`[TrackingSync] order #${o.id} gagal poll: ${e?.message || 'error'}`);
            }
          })
        );
      }
    } catch (e: any) {
      console.warn(`[TrackingSync] run error: ${e?.message || 'error'}`);
    }
  };

  // Jalan pertama setelah 60 detik (biar server selesai boot), lalu tiap 30 menit
  const first = setTimeout(() => run(), 60 * 1000);
  const interval = setInterval(run, SYNC_INTERVAL_MS);
  // Supaya tidak blocking process exit di test/dev
  interval.unref?.();
  first.unref?.();
  return interval;
}
