import React, { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Panel Data Demo (Seeder) — untuk persiapan presentasi / testing.
//
// - "Isi Data Demo"     : tulis snapshot data toko (produk, kategori, banner,
//                         artikel + relasinya) — salinan dari data produksi,
//                         jadi tampilan toko pulih persis seperti di server.
// - "Kosongkan Data"    : hapus ISI tabel konten (bukan tabelnya) supaya bisa
//                         input data asli dari awal. Wajib ketik kata konfirmasi.
//
// Akun admin, pengaturan toko (nama/WA/logo/QRIS), dan teks landing TIDAK ikut
// terhapus — supaya tidak perlu setel ulang dari nol dan tidak terkunci dari panel.
// ---------------------------------------------------------------------------

interface DemoSeedPanelProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  /** Dipanggil setelah data berubah, supaya tabel lain di panel admin ikut refresh. */
  onDataChanged?: () => void;
}

const LABELS: Record<string, string> = {
  products: 'Produk',
  categories: 'Kategori',
  banners: 'Banner',
  articles: 'Artikel',
};

export const DemoSeedPanel: React.FC<DemoSeedPanelProps> = ({ showToast, onDataChanged }) => {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [confirmWord, setConfirmWord] = useState('SEED');
  const [isBusy, setIsBusy] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const { demoSeedApi } = await import('../../api/adminApi');
      const res = await demoSeedApi.getStatus();
      if (res) {
        setCounts(res.counts);
        setConfirmWord(res.confirmWord || 'SEED');
      }
    } catch {
      // biarkan kosong — panel tetap bisa dipakai, angka muncul setelah aksi
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleApply = async () => {
    setIsBusy(true);
    try {
      const { demoSeedApi } = await import('../../api/adminApi');
      const res = await demoSeedApi.apply();
      if (res) {
        setCounts({ ...counts, ...res });
      }
      showToast('Data demo berhasil diisi. Tampilan toko langsung diperbarui.');
      onDataChanged?.();
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengisi data demo.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleClear = async () => {
    setIsBusy(true);
    try {
      const { demoSeedApi } = await import('../../api/adminApi');
      await demoSeedApi.clear(confirmInput.trim().toUpperCase());
      showToast('Data konten berhasil dikosongkan.');
      setShowClearModal(false);
      setConfirmInput('');
      await loadStatus();
      onDataChanged?.();
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengosongkan data.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null;

  return (
    <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2EFE0] dark:border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-xl text-[#1F5132] dark:text-[#86EFAC]">database</span>
          <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">
            Data Demo (Seeder)
          </h3>
        </div>
        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] rounded-md border border-[#3A8F4B]/20">
          Persiapan Presentasi
        </span>
      </div>

      <p className="text-xs text-[#556353] dark:text-white/60 leading-relaxed">
        Isi data toko supaya saat presentasi atau testing toko sudah ada isinya, atau kosongkan
        data konten untuk memulai input data asli dari awal. Akun admin, pengaturan toko, dan teks
        beranda <span className="font-bold text-[#1F5132] dark:text-[#86EFAC]">tidak ikut terhapus</span>.
      </p>

      {/* Jumlah data saat ini */}
      <div className="rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3]">Data konten saat ini</span>
          <button
            type="button"
            onClick={loadStatus}
            disabled={isBusy}
            title="Muat ulang jumlah data"
            className="text-[#556353] dark:text-white/60 hover:text-[#1F5132] dark:hover:text-[#86EFAC] transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.keys(LABELS).map((key) => (
            <div
              key={key}
              className="rounded-lg bg-white dark:bg-[#0E1A11] border border-[#E2EFE0] dark:border-white/10 px-3 py-2 text-center"
            >
              <div className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">
                {counts ? counts[key] ?? 0 : '–'}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#556353] dark:text-white/60">
                {LABELS[key]}
              </div>
            </div>
          ))}
        </div>
        {total !== null && (
          <p className="text-[10px] text-[#556353] dark:text-white/50 mt-2.5">
            {total === 0
              ? 'Data konten kosong — siap diisi data asli atau data demo.'
              : `Total ${total} baris data konten tersimpan.`}
          </p>
        )}
      </div>

      {/* Aksi */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleApply}
          disabled={isBusy}
          className="flex-1 bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <span className="material-symbols-outlined text-base">
            {isBusy ? 'progress_activity' : 'auto_awesome'}
          </span>
          <span>{isBusy ? 'Memproses…' : 'Isi Data Demo'}</span>
        </button>

        <button
          type="button"
          onClick={() => { setConfirmInput(''); setShowClearModal(true); }}
          disabled={isBusy}
          className="flex-1 sm:flex-none bg-white dark:bg-transparent hover:bg-[#FFEBEE] dark:hover:bg-[#2A1414] disabled:opacity-60 disabled:cursor-not-allowed text-[#D32F2F] border border-[#D32F2F]/40 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-base">delete_sweep</span>
          <span>Kosongkan Data</span>
        </button>
      </div>

      <p className="text-[10px] text-[#556353] dark:text-white/50 leading-relaxed">
        "Isi Data Demo" aman diklik berkali-kali — datanya selalu sama, tidak menumpuk.
        "Kosongkan Data" hanya menghapus isi tabel produk, kategori, banner, dan artikel.
      </p>

      {/* Modal konfirmasi kosongkan data */}
      {showClearModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0E1A11] rounded-2xl shadow-2xl border border-[#E2EFE0] dark:border-white/10 p-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FFEBEE] text-[#D32F2F] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">
                Kosongkan semua data konten?
              </h3>
              <p className="text-xs text-[#556353] dark:text-white/70 leading-relaxed">
                Seluruh <span className="font-bold">produk, kategori, banner, dan artikel</span> akan
                dihapus permanen. Akun admin, pengaturan toko, dan teks beranda tetap aman.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1.5">
                Ketik <span className="font-mono text-[#D32F2F]">{confirmWord}</span> untuk melanjutkan
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={confirmWord}
                autoFocus
                className="w-full px-3.5 py-2 text-sm font-mono font-bold rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] focus:bg-white dark:focus:bg-[#1B2C1F] focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F] text-[#14331C] dark:text-[#F4F8F3] tracking-widest"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowClearModal(false); setConfirmInput(''); }}
                disabled={isBusy}
                className="flex-1 py-2.5 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-transparent text-[#556353] dark:text-white/70 font-bold text-xs hover:bg-[#F7F8F6] dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isBusy || confirmInput.trim().toUpperCase() !== confirmWord}
                className="flex-1 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#C62828] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                {isBusy ? 'Menghapus…' : 'Ya, Kosongkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
