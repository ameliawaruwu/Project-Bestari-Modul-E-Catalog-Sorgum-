import React, { useState, useEffect, useCallback } from 'react';
import type { ContentSeedStatus, ContentSeedTarget } from '../../api/adminApi';

// ---------------------------------------------------------------------------
// Panel Seeder Konten — isi / hapus artikel dan kartu "Lacak Paket" contoh dari
// data katalog (backend/src/data/catalog_reference.json).
//
// - Artikel : "Isi" menulis artikel snapshot (artikel snapshot lama diganti);
//             "Hapus" menghapus artikel snapshot saja — artikel buatan admin aman.
// - Lacak   : "Isi" menampilkan kartu resi contoh di halaman Lacak Paket;
//             "Hapus" mengosongkannya.
// ---------------------------------------------------------------------------

interface ContentSeedPanelProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onDataChanged?: () => void;
}

type Action = { target: ContentSeedTarget; kind: 'apply' | 'clear' };

const COPY: Record<ContentSeedTarget, Record<'apply' | 'clear', { title: string; body: string; done: string }>> = {
  articles: {
    apply: {
      title: 'Isi artikel dari data katalog?',
      body: 'Artikel dari data katalog ditambahkan. Artikel hasil seeder sebelumnya diganti; artikel buatan admin tetap aman.',
      done: 'Artikel berhasil diisi.',
    },
    clear: {
      title: 'Hapus artikel hasil seeder?',
      body: 'Hanya artikel dari data katalog yang dihapus. Artikel buatan admin tetap aman.',
      done: 'Artikel hasil seeder berhasil dihapus.',
    },
  },
  tracking: {
    apply: {
      title: 'Isi data lacak pesanan?',
      body: 'Kartu resi contoh akan langsung tampil di halaman Lacak Paket.',
      done: 'Data lacak pesanan berhasil diisi.',
    },
    clear: {
      title: 'Hapus data lacak pesanan?',
      body: 'Kartu resi contoh di halaman Lacak Paket dihilangkan.',
      done: 'Data lacak pesanan berhasil dihapus.',
    },
  },
};

export const ContentSeedPanel: React.FC<ContentSeedPanelProps> = ({ showToast, onDataChanged }) => {
  const [status, setStatus] = useState<ContentSeedStatus | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [modal, setModal] = useState<Action | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const { contentSeedApi } = await import('../../api/adminApi');
      setStatus(await contentSeedApi.getStatus());
    } catch {
      // panel tetap bisa dipakai
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const run = async ({ target, kind }: Action) => {
    setIsBusy(true);
    try {
      const { contentSeedApi } = await import('../../api/adminApi');
      await contentSeedApi.run(target, kind);
      showToast(COPY[target][kind].done);
      setModal(null);
      await loadStatus();
      onDataChanged?.();
    } catch (e: any) {
      showToast(e?.message || 'Aksi seeder gagal.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const rows: Array<{ target: ContentSeedTarget; icon: string; label: string; info: string; canClear: boolean }> = [
    {
      target: 'articles',
      icon: 'article',
      label: 'Artikel',
      info: status
        ? `${status.seededArticleCount}/${status.seedArticleTotal} artikel seeder terpasang · total ${status.articleCount} artikel`
        : '–',
      canClear: !!status && status.seededArticleCount > 0,
    },
    {
      target: 'tracking',
      icon: 'local_shipping',
      label: 'Lacak Pesanan',
      info: status
        ? status.trackingActive
          ? `Kartu contoh tampil · resi ${status.trackingResi}`
          : `Kosong · contoh resi ${status.seedTrackingResi ?? '–'}`
        : '–',
      canClear: !!status && status.trackingActive,
    },
  ];

  const copy = modal ? COPY[modal.target][modal.kind] : null;
  const isApply = modal?.kind === 'apply';

  return (
    <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#E2EFE0] dark:border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-xl text-[#1F5132] dark:text-[#86EFAC]">database</span>
          <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">
            Seeder Artikel &amp; Lacak Pesanan
          </h3>
        </div>
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

      <div className="space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.target}
            className="rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] p-3.5 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="material-symbols-outlined text-lg text-[#1F5132] dark:text-[#86EFAC]">{r.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#14331C] dark:text-[#F4F8F3]">{r.label}</div>
                <div className="text-[10px] text-[#556353] dark:text-white/60 truncate">{r.info}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setModal({ target: r.target, kind: 'clear' })}
                disabled={isBusy || !r.canClear}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#D32F2F] hover:bg-[#FFEBEE] dark:hover:bg-[#2A1414] border border-[#D32F2F]/25 hover:border-[#D32F2F]/50 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                <span>Hapus</span>
              </button>
              <button
                type="button"
                onClick={() => setModal({ target: r.target, kind: 'apply' })}
                disabled={isBusy}
                className="bg-gradient-to-r from-[#3A8F4B] to-[#5AA563] hover:from-[#2F773E] hover:to-[#4A8D52] disabled:opacity-60 text-white px-3.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                <span>Isi Data</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && copy && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0E1A11] rounded-2xl shadow-2xl border border-[#E2EFE0] dark:border-white/10 p-6 space-y-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${isApply ? 'bg-[#EAF6E8] text-[#1F5132]' : 'bg-[#FFEBEE] text-[#D32F2F]'}`}>
              <span className="material-symbols-outlined text-3xl">{isApply ? 'download' : 'delete_forever'}</span>
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">{copy.title}</h3>
              <p className="text-xs text-[#556353] dark:text-white/70 leading-relaxed">{copy.body}</p>
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
                {isBusy ? 'Memproses…' : isApply ? 'Ya, Isi' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
