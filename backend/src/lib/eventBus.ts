// ---------------------------------------------------------------------------
// EventBus — pub/sub in-memory untuk SSE realtime.
// Admin mutasi data → publish event → semua client (admin & user) yang
// subscribe dapat notifikasi → FE refetch → data admin == data user realtime.
// ---------------------------------------------------------------------------

type Listener = (payload: unknown) => void;

// Map event type -> Set of listeners. Satu server instance = satu bus.
const listeners = new Map<string, Set<Listener>>();

export const eventBus = {
  /**
   * Subscribe ke event type tertentu. Return unsubscribe function.
   */
  on(eventType: string, fn: Listener): () => void {
    let set = listeners.get(eventType);
    if (!set) {
      set = new Set();
      listeners.set(eventType, set);
    }
    set.add(fn);
    return () => {
      set!.delete(fn);
    };
  },

  /**
   * Publish event ke semua subscriber. Payload bebas (biasanya { at: Date }).
   */
  emit(eventType: string, payload: unknown = {}): void {
    const set = listeners.get(eventType);
    if (!set || set.size === 0) return;
    const data = { ...(payload as object), at: new Date().toISOString() };
    for (const fn of set) {
      try {
        fn(data);
      } catch (e) {
        console.error('[EventBus] listener error', eventType, e);
      }
    }
  },
};

// Event types terpusat — dipakai route handler (publish) & events route (subscribe).
export const EVENTS = {
  PRODUCTS: 'products',
  ARTICLES: 'articles',
  FAQS: 'faqs',
  BANNERS: 'banners',
  LANDING: 'landing',
  SETTINGS: 'settings',
  VOUCHERS: 'vouchers',
  USERS: 'users',
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];
