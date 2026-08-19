// Util status order — SINGLE SOURCE OF TRUTH untuk state machine transisi status
// (sinkron dgn backend/src/services/checkout_service.ts ALLOWED_ORDER_TRANSITIONS).
// I2-5: admin TIDAK bisa mundur status & tidak bisa keluar dari status terminal.

import { Order } from '../types';

export const ORDER_STATUS_LABELS: Record<string, Order['status']> = {
  pending: 'Pending',
  confirmed: 'Diproses',
  processed: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'processed', 'cancelled'],
  processed: ['processed', 'shipped', 'cancelled'],
  shipped: ['shipped', 'delivered'],
  delivered: ['delivered'], // terminal
  cancelled: ['cancelled'], // terminal
};

/** Status raw (enum BE) dari label FE — fallback cari balik dari label */
export function getStatusRawFromLabel(label?: Order['status']): string {
  if (!label) return 'pending';
  const found = Object.entries(ORDER_STATUS_LABELS).find(([, v]) => v === label);
  return found?.[0] || 'pending';
}

/** Opsi status yang valid dari status raw saat ini (termasuk status sekarang). */
export function getAllowedStatusOptions(statusRaw?: string, currentLabel?: Order['status']): Order['status'][] {
  const raw = statusRaw || getStatusRawFromLabel(currentLabel);
  const options = (ORDER_STATUS_TRANSITIONS[raw] || [raw]).map((k) => ORDER_STATUS_LABELS[k]).filter(Boolean);
  if (currentLabel && !options.includes(currentLabel)) {
    options.unshift(currentLabel);
  }
  return [...new Set(options)];
}
