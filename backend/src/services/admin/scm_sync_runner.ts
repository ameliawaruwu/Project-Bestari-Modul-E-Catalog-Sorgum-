import { config } from '../../lib/config';
import { eventBus, EVENTS } from '../../lib/eventBus';
import { syncScm } from './scm_seed_service';

// ---------------------------------------------------------------------------
// Pemicu sinkron SCM yang aman dipanggil sesering apa pun (polling, request
// daftar produk). Throttle singkat supaya API SCM tidak dibanjiri; kalau ada
// perubahan → event SSE `products` → admin & user langsung refetch.
// ---------------------------------------------------------------------------

const MIN_GAP_MS = 5_000;
let lastRun = 0;

export function triggerScmSync(): void {
  if (!config.scm.apiKey) return;
  const now = Date.now();
  if (now - lastRun < MIN_GAP_MS) return;
  lastRun = now;
  syncScm()
    .then((r) => {
      if (r.active && r.updated + r.created + r.deactivated > 0) {
        console.log(`[SCM Sync] diperbarui ${r.updated}, baru ${r.created}, nonaktif ${r.deactivated}`);
        eventBus.emit(EVENTS.PRODUCTS, { action: 'scm-sync' });
      }
    })
    .catch((e) => console.error('[SCM Sync] gagal:', (e as Error).message));
}
