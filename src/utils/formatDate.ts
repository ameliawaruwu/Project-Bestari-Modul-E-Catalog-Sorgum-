/**
 * Formatter tanggal konsisten (id-ID) — satu sumber kebenaran.
 *
 * Mode:
 * - 'short'    → 12 Agu 2026             (banner/artikel card)
 * - 'long'     → 12 Agustus 2026          (tabel admin, artikel detail)
 * - 'datetime' → 12 Agu 2026, 14.30      (tracking, riwayat)
 * - 'full'     → 12/08/2026 14.30        (datetime mentah, fallback)
 */
export function formatDate(
  value: string | Date | null | undefined,
  mode: 'short' | 'long' | 'datetime' | 'full' = 'short',
): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  switch (mode) {
    case 'long':
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    case 'datetime':
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'full':
      return date.toLocaleString('id-ID');
    case 'short':
    default:
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
