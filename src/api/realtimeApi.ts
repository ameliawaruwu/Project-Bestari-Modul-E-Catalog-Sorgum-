// ---------------------------------------------------------------------------
// realtimeApi — SSE (Server-Sent Events) client untuk sync realtime.
// BE publish event setelah mutasi data (produk/order/artikel/FAQ/banner/
// landing/settings/voucher). FE subscribe di sini → AppContext refetch data
// yang berubah → semua client (admin & user) tampilkan data TERBARU tanpa
// refresh manual. Data admin == data user, realtime.
// ---------------------------------------------------------------------------

export type RealtimeEventType =
  | 'products'
  | 'articles'
  | 'faqs'
  | 'banners'
  | 'landing'
  | 'settings';

// EventSource global — satu koneksi per tab, semua komponen pakai ini.
let source: EventSource | null = null;
const handlers = new Map<RealtimeEventType, Set<(payload: unknown) => void>>();

function connect() {
  if (source) return; // sudah connect
  source = new EventSource('/api/events/stream');

  source.onopen = () => {
    // console.log('[SSE] connected');
  };

  // Event handler generik: baca `event` dari server (nama event type)
  source.onmessage = () => {
    // fallback (tidak terpakai — semua event kirim `event:` named)
  };

  source.addEventListener('connected', () => {
    // console.log('[SSE] handshake ok');
  });

  // Auto-reconnect: EventSource built-in reconnect dengan delay — cukup
  // set ulang handler untuk tiap event type yang sudah di-subscribe.
  source.onerror = () => {
    // EventSource otomatis reconnect (server-side stream di BE handle
    // disconnect → cleanup listener). Kalau source mati total, buat baru.
    if (source) {
      source.close();
      source = null;
    }
    // Reconnect dengan delay biar tidak spam saat BE restart
    setTimeout(() => {
      if (handlers.size > 0) connect();
    }, 3000);
  };

  // Daftarkan listener dinamis untuk setiap event type
  for (const type of handlers.keys()) {
    attachEventListener(type);
  }
}

function attachEventListener(type: RealtimeEventType) {
  if (!source) return;
  // Remove dulu kalau sudah ada (biar tidak dobel setelah reconnect)
  source.removeEventListener(type, onEvent as EventListener);
  source.addEventListener(type, onEvent as EventListener);
}

// Single handler yang dispatch ke semua subscriber tipe tsb
function onEvent(e: Event) {
  const type = (e as MessageEvent).type as RealtimeEventType;
  let payload: unknown = {};
  try {
    payload = JSON.parse((e as MessageEvent).data || '{}');
  } catch {
    payload = {};
  }
  const set = handlers.get(type);
  if (set) {
    for (const fn of set) {
      try {
        fn(payload);
      } catch (err) {
        console.error('[SSE] handler error', type, err);
      }
    }
  }
}

export const realtimeApi = {
  /**
   * Subscribe ke event type. Return unsubscribe function.
   */
  on(type: RealtimeEventType, fn: (payload: unknown) => void): () => void {
    let set = handlers.get(type);
    if (!set) {
      set = new Set();
      handlers.set(type, set);
    }
    set.add(fn);
    // Pastikan source terhubung & listener untuk type ini terpasang
    if (!source) connect();
    else attachEventListener(type);
    return () => {
      set.delete(fn);
      if (set.size === 0) handlers.delete(type);
    };
  },

  /**
   * Tutup semua koneksi (dipakai saat logout / unmount global).
   */
  disconnect(): void {
    if (source) {
      source.close();
      source = null;
    }
    handlers.clear();
  },
};
