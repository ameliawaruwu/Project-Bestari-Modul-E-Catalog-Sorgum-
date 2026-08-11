import React, { useEffect, useState, useCallback } from 'react';

// ───────────────────────────────────────────────────────────────────────────
// ConnectionErrorModal — pop-up global saat koneksi ke backend bermasalah.
// Dipicu oleh CustomEvent 'app:connection-error' (dari http.ts setelah semua
// retry gagal) — bukan toast kecil, tapi modal tegas yang kasih tahu:
//   "Koneksi bermasalah / Backend tidak dapat dihubungi"
// + tombol "Muat Ulang Halaman" (refresh) & "Coba Lagi" (retry).
// Auto-tutup kalau koneksi pulih ('app:connection-restored').
// ───────────────────────────────────────────────────────────────────────────

export const ConnectionErrorModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    window.addEventListener('app:connection-error', show);
    window.addEventListener('app:connection-restored', hide);
    window.addEventListener('online', show); // browser detect offline
    window.addEventListener('offline', show);
    return () => {
      window.removeEventListener('app:connection-error', show);
      window.removeEventListener('app:connection-restored', hide);
      window.removeEventListener('online', show);
      window.removeEventListener('offline', show);
    };
  }, [show, hide]);

  if (!visible) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Ping health endpoint — kalau sukses, koneksi pulih → modal tutup.
      const r = await fetch('/api/health', { cache: 'no-store' });
      if (r.ok) {
        hide();
      } else {
        // masih gagal — biarkan modal terbuka
      }
    } catch {
      // masih gagal
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-[#E0E0E0] text-center space-y-4 animate-fadeIn">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[#FFEBEE] flex items-center justify-center">
          <span className="material-symbols-outlined text-[#D32F2F] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            wifi_off
          </span>
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#1B5E20] font-['Playfair_Display']">
            Koneksi Bermasalah
          </h2>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed mt-1.5">
            Tidak dapat terhubung ke server. Kemungkinan koneksi internet Anda
            sedang bermasalah atau server sedang maintenance.
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full h-11 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Muat Ulang Halaman
          </button>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full h-11 bg-[#F7F8F6] hover:bg-[#E8F5E9] border border-[#E0E0E0] text-[#1B5E20] rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">sync</span>
            {retrying ? 'Menghubungi...' : 'Coba Lagi'}
          </button>
        </div>

        <p className="text-[10px] text-[#999999] pt-1">
          Jika masalah berlanjut, periksa koneksi internet Anda atau hubungi admin.
        </p>
      </div>
    </div>
  );
};
