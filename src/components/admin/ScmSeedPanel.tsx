import React, { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Panel Seeder SCM — ambil produk olahan dari API SCM ke toko.
//
// - "Fetch dari SCM"   : fetch pertama mengganti produk toko dengan produk SCM
//                        (harga/kategori/WA dari data referensi katalog). Fetch
//                        berikutnya hanya memperbarui yang berubah di SCM —
//                        editan admin tetap.
// - "Hapus Data Fetch" : hapus produk hasil fetch SCM saja & matikan fetch
//                        otomatis → toko tetap kosong sampai Fetch lagi.
// Selama mode SCM aktif, backend fetch ulang otomatis kalau data SCM berubah.
// ---------------------------------------------------------------------------

interface ScmSeedPanelProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onDataChanged?: () => void;
}

import type { ScmSeedStatus as ScmStatus } from '../../api/adminApi';

export const ScmSeedPanel: React.FC<ScmSeedPanelProps> = ({ showToast, onDataChanged }) => {
  const [status, setStatus] = useState<ScmStatus | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [modal, setModal] = useState<'apply' | 'clear' | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const { scmSeedApi } = await import('../../api/adminApi');
      setStatus(await scmSeedApi.getStatus());
    } catch {
      // panel tetap bisa dipakai
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const run = async (kind: 'apply' | 'clear') => {
    setIsBusy(true);
    try {
      const { scmSeedApi } = await import('../../api/adminApi');
      if (kind === 'apply') {
        const res = await scmSeedApi.apply();
        showToast(`Fetch SCM selesai: ${res?.created ?? 0} baru, ${res?.updated ?? 0} diperbarui, ${res?.removed ?? 0} dihapus.`);
      } else {
        await scmSeedApi.clear();
        showToast('Data hasil fetch SCM berhasil dihapus.');
      }
      setModal(null);
      await loadStatus();
      onDataChanged?.();
    } catch (e: any) {
      showToast(e?.message || 'Aksi seeder SCM gagal.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const isApply = modal === 'apply';

  return (
    <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-5 flex-1">
        <div className="flex items-center justify-between border-b border-[#E2EFE0] dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl text-[#1F5132] dark:text-[#86EFAC]">cloud_download</span>
            <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">
              Data SCM (Seeder)
            </h3>
          </div>
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] rounded-md border border-[#3A8F4B]/20">
            Produk Olahan
          </span>
        </div>

        <div className="rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3]">Status</span>
            <button
              type="button"
              onClick={loadStatus}
              disabled={isBusy}
              title="Muat ulang status"
              className="text-[#556353] dark:text-white/60 hover:text-[#1F5132] dark:hover:text-[#86EFAC] transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Hasil Fetch', value: status ? status.fetchedCount : '–' },
              { label: 'Total Produk', value: status ? status.productCount : '–' },
            ].map((c) => (
              <div key={c.label} className="rounded-lg bg-white dark:bg-[#0E1A11] border border-[#E2EFE0] dark:border-white/10 px-3 py-2 text-center">
                <div className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">{c.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#556353] dark:text-white/60">{c.label}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#556353] dark:text-white/50">
            {status && !status.keyConfigured
              ? 'API key SCM belum diatur di backend/.env (ECATALOG_BESTARI_SCM_API_KEY).'
              : status && status.fetchedCount === 0
                ? 'Mode SCM mati — toko tidak di-fetch otomatis. "Fetch dari SCM" mengisi produk toko dari SCM dan menyalakan fetch otomatis.'
                : `Mode SCM aktif — data SCM dicek otomatis${status && status.fetchSeconds > 0 ? ` tiap ${status.fetchSeconds >= 60 ? `${Math.round(status.fetchSeconds / 60)} menit` : `${status.fetchSeconds} detik`}` : ''} dan di-fetch ulang kalau berubah. "Hapus Data Fetch" mematikannya.${status?.lastFetchAt ? ` Terakhir: ${new Date(status.lastFetchAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.` : ''}`}
          </p>
        </div>
      </div>

      <div className="pt-4 mt-5 border-t border-[#E2EFE0]/60 dark:border-white/10 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setModal('clear')}
          disabled={isBusy || !status || status.fetchedCount === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#D32F2F] hover:bg-[#FFEBEE] dark:hover:bg-[#2A1414] border border-[#D32F2F]/25 hover:border-[#D32F2F]/50 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
          <span>Hapus Data Fetch</span>
        </button>
        <button
          type="button"
          onClick={() => setModal('apply')}
          disabled={isBusy}
          className="bg-gradient-to-r from-[#3A8F4B] to-[#5AA563] hover:from-[#2F773E] hover:to-[#4A8D52] disabled:opacity-60 text-white px-3.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <span className="material-symbols-outlined text-[15px]">{isBusy ? 'progress_activity' : 'cloud_download'}</span>
          <span>{isBusy ? 'Memproses…' : 'Fetch dari SCM'}</span>
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0E1A11] rounded-2xl shadow-2xl border border-[#E2EFE0] dark:border-white/10 p-6 space-y-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${isApply ? 'bg-[#EAF6E8] text-[#1F5132]' : 'bg-[#FFEBEE] text-[#D32F2F]'}`}>
              <span className="material-symbols-outlined text-3xl">{isApply ? 'cloud_download' : 'delete_forever'}</span>
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">
                {isApply ? 'Ambil data terbaru dari SCM?' : 'Hapus data hasil fetch SCM?'}
              </h3>
              <p className="text-xs text-[#556353] dark:text-white/70 leading-relaxed">
                {isApply
                  ? status && status.fetchedCount > 0
                    ? 'Produk diperbarui dari SCM: produk baru ditambahkan, yang hilang dari SCM dihapus. Editan admin (deskripsi, harga, nomor WA, pengiriman) tetap.'
                    : 'Semua produk saat ini akan diganti produk dari SCM.'
                  : 'Produk hasil fetch SCM akan dihapus dan fetch otomatis dimatikan sampai Anda Fetch lagi. Kategori, banner, dan artikel tetap aman.'}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={isBusy}
                className="flex-1 py-2.5 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-transparent text-[#556353] dark:text-white/70 font-bold text-xs hover:bg-[#F7F8F6] dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => run(modal)}
                disabled={isBusy}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50 ${isApply ? 'bg-[#3A8F4B] hover:bg-[#2F773E]' : 'bg-[#D32F2F] hover:bg-[#C62828]'}`}
              >
                {isBusy ? 'Memproses…' : isApply ? 'Ya, Fetch' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
