import React, { useEffect, useState, useCallback, useRef } from 'react';

// ───────────────────────────────────────────────────────────────────────────
// ConnectionErrorModal — pop-up global saat koneksi ke backend bermasalah.
// Dipicu oleh CustomEvent 'app:connection-error' (dari http.ts setelah semua
// retry gagal) — bukan toast kecil, tapi modal tegas yang kasih tahu:
//   "Koneksi bermasalah / Backend tidak dapat dihubungi"
// + tombol "Muat Ulang Halaman" (refresh) & "Coba Lagi" (retry).
//
// ANTI-FLICKER: modal minimal tampil MIN_VISIBLE_MS (3 detik) sebelum bisa
// auto-tutup. Tanpa ini, request gagal → sukses → gagal → sukses dalam waktu
// cepat bikin modal kedip-kedip (masalah notif sebelumnya). 'connection-
// restored' yang datang terlalu cepat DITUNDA sampai waktu minimal terpenuhi;
// error baru membatalkan penundaan itu (modal tetap tampil).
// ───────────────────────────────────────────────────────────────────────────

const MIN_VISIBLE_MS = 3000; // minimal tampil sebelum auto-tutup

export const ConnectionErrorModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const shownAtRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    shownAtRef.current = Date.now();
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setVisible(true);
  }, []);

  // Hide yang menghormati waktu minimal tampil — kalau belum lewat
  // MIN_VISIBLE_MS, tunda sampai sisa waktu (error baru → show() batalkan).
  const hide = useCallback(() => {
    // Kalau modal memang sedang tidak tampil, abaikan (hindari timer sia-sia).
    setVisible((wasVisible) => {
      if (!wasVisible) return false;
      const elapsed = Date.now() - shownAtRef.current;
      const remaining = MIN_VISIBLE_MS - elapsed;
      if (remaining <= 0) return false;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setVisible(false), remaining);
      return true; // tetap tampil sampai timer selesai
    });
  }, []);

  useEffect(() => {
    window.addEventListener('app:connection-error', show);
    window.addEventListener('app:connection-restored', hide);
    window.addEventListener('offline', show); // browser offline → tampil
    window.addEventListener('online', hide); // browser online lagi → tutup (setelah min time)
    return () => {
      window.removeEventListener('app:connection-error', show);
      window.removeEventListener('app:connection-restored', hide);
      window.removeEventListener('offline', show);
      window.removeEventListener('online', hide);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
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
