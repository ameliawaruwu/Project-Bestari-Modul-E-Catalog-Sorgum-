import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const TrackingPage: React.FC = () => {
  const { t, shopSettings } = useApp();
  const [resi, setResi] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ resi: string; at: number }>>([]);
  const [courier, setCourier] = useState('');

  // Kode ekspedisi (format adjisoft/cekresi.com) — dipakai sbg hint agar tracking akurat.
  // KOSONG = auto-detect (cekresi.com menebak sendiri).
  const COURIER_OPTIONS: Array<{ code: string; label: string }> = [
    { code: 'JNE', label: 'JNE' },
    { code: 'JT', label: 'J&T Express' },
    { code: 'SPX', label: 'SiCepat / Shopee Express' },
    { code: 'TIKI', label: 'TIKI' },
    { code: 'POS', label: 'POS Indonesia' },
    { code: 'NINJA', label: 'Ninja Xpress' },
    { code: 'LIONPARCEL', label: 'Lion Parcel' },
    { code: 'ANTERAJA', label: 'Anteraja' },
    { code: 'WAHANA', label: 'Wahana' },
    { code: 'CITYLINK', label: 'CityLink' },
    { code: 'IDEXPRESS', label: 'ID Express' },
    { code: 'REX', label: 'REX Express' },
    { code: 'JX', label: 'JX' },
    { code: 'SAP', label: 'SAP Express' },
  ];

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem('bestari_tracking_history');
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const trackResi = async (code: string, selectedCourier?: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t('Masukkan nomor resi pengiriman', 'Enter tracking number'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const qs = selectedCourier ? `?courier=${encodeURIComponent(selectedCourier)}` : '';
      const res = await fetch(`/api/tracking/${encodeURIComponent(trimmed)}${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t('Gagal melacak resi', 'Failed to track package'));
      if (json?.status === 500 || json?.error) throw new Error(json?.message || json?.error);
      const data = json?.data?.data || json?.data || json;
      if (json?.data?.valid === false) throw new Error(t('Resi tidak valid atau belum terdaftar di sistem kurir', 'Tracking number invalid or not registered yet'));
      setResult(data);

      try {
        const key = 'bestari_tracking_history';
        const hist = JSON.parse(localStorage.getItem(key) || '[]');
        const entry = { resi: trimmed, at: Date.now() };
        const next = [entry, ...hist.filter((h: any) => h.resi !== entry.resi)].slice(0, 5);
        localStorage.setItem(key, JSON.stringify(next));
        setHistory(next);
      } catch {}
    } catch (err: any) {
      setError(err?.message || t('Gagal melacak resi. Coba lagi beberapa saat.', 'Failed to track package. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    trackResi(resi, courier || undefined);
  };

  const cleanWaNumber = shopSettings.whatsappNumber.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const waHelpUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Halo Admin Bestari, saya ingin bertanya tentang status pengiriman paket saya.')}`;

  return (
    <div className="pt-6 sm:pt-8 pb-16 px-4 sm:px-6 md:px-10 max-w-5xl mx-auto min-h-screen animate-fadeIn">
      
      {/* ── 1. Hero Header Section ── */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
          {t('Lacak Pengiriman Pesanan', 'Track Your Shipment')}
        </h1>

        <p className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base text-[#465444] dark:text-[#CBD5C8] leading-relaxed">
          {t(
            'Pantau status dan posisi paket produk sorgum Anda secara langsung dan real-time.',
            'Track the real-time status and movement of your sorghum package directly from couriers.'
          )}
        </p>
      </div>

      {/* ── 2. Interactive Tracking Box ── */}
      <div className="bg-white dark:bg-[#0E1A11] p-6 sm:p-8 rounded-3xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-sm mb-10 max-w-3xl mx-auto">
        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-[#14331C] dark:text-[#F4F8F3] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#245B3A] dark:text-[#86EFAC]">
                  barcode_scanner
                </span>
                <span>{t('Nomor Resi Pengiriman', 'Tracking Number')}</span>
              </label>

              {resi && (
                <button
                  type="button"
                  onClick={() => setResi('')}
                  className="text-xs text-[#556353] hover:text-[#D32F2F] cursor-pointer"
                >
                  {t('Hapus', 'Clear')}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                value={resi}
                onChange={(e) => setResi(e.target.value)}
                placeholder="Contoh: JNT1234567890 / SOC123456"
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-[#C5D8C1] dark:border-white/20 bg-[#F9FBF7] dark:bg-[#122316] text-sm sm:text-base font-mono font-bold text-[#14331C] dark:text-white placeholder:font-sans placeholder:font-normal placeholder:text-xs placeholder:sm:text-sm placeholder:text-[#556353]/60 focus:outline-none focus:border-[#245B3A] dark:focus:border-[#86EFAC] transition-all shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#556353] dark:text-white/40 pointer-events-none">
                search
              </span>
            </div>
          </div>

          {/* Pilihan Ekspedisi — bantu cek-resi menebak kurir dengan benar */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#14331C] dark:text-[#F4F8F3] mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#245B3A] dark:text-[#86EFAC]">
                local_shipping
              </span>
              <span>{t('Ekspedisi (Opsional)', 'Courier (Optional)')}</span>
            </label>
            <div className="relative">
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full appearance-none pl-4 pr-12 py-3.5 rounded-2xl border border-[#C5D8C1] dark:border-white/20 bg-[#F9FBF7] dark:bg-[#122316] text-sm text-[#14331C] dark:text-white font-semibold focus:outline-none focus:border-[#245B3A] dark:focus:border-[#86EFAC] transition-all cursor-pointer"
              >
                <option value="">{t('Deteksi Otomatis', 'Auto-detect')}</option>
                {COURIER_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#556353] dark:text-white/40 pointer-events-none">
                expand_more
              </span>
            </div>
            <p className="text-[10px] text-[#556353] dark:text-white/50 mt-1.5">
              {t(
                'Jika resi tidak terbaca, pilih ekspedisi yang sesuai agar pelacakan lebih akurat.',
                "If tracking fails, select the right courier for more accurate results."
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !resi.trim()}
            className="w-full bg-[#245B3A] hover:bg-[#14331C] disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('Sedang Melacak...', 'Tracking Package...')}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">travel_explore</span>
                <span>{t('Lacak Paket Sekarang', 'Track Package Now')}</span>
              </>
            )}
          </button>
        </form>

        {/* Riwayat Resi Terakhir */}
        {history.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#E2EFE0] dark:border-white/10 flex items-center gap-2 flex-wrap text-xs text-[#556353] dark:text-white/60">
            <span className="font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">history</span>
              <span>{t('Resi Terakhir:', 'Recent:')}</span>
            </span>
            {history.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setResi(item.resi);
                  trackResi(item.resi, courier || undefined);
                }}
                className="font-mono font-medium px-2.5 py-1 rounded-lg bg-[#F2F7F0] dark:bg-[#152718] text-[#245B3A] dark:text-[#86EFAC] hover:bg-[#245B3A] hover:text-white dark:hover:bg-[#245B3A] transition-colors cursor-pointer border border-[#C5D8C1]/60 dark:border-white/10"
              >
                {item.resi}
              </button>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-5 p-4 rounded-2xl bg-[#FFEBEE] dark:bg-red-950/40 border border-[#FFCDD2] dark:border-red-900/50 text-xs sm:text-sm text-[#D32F2F] dark:text-red-300 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Result Details */}
        {result && (
          <div className="mt-6 pt-6 border-t border-[#E2EFE0] dark:border-white/10 space-y-5 animate-fadeIn">
            
            {/* Status Header */}
            <div className="flex justify-between items-start flex-wrap gap-3 bg-[#F4F8F2] dark:bg-[#122316] p-4 sm:p-5 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.2)]">
              <div>
                <p className="text-xs font-semibold text-[#556353] dark:text-white/60 uppercase tracking-wider">{t('Nomor Resi', 'Tracking No')}</p>
                <p className="font-mono font-black text-lg sm:text-xl text-[#14331C] dark:text-[#86EFAC] mt-0.5">
                  {result.noResi || result.tracking_number || resi}
                </p>
                <p className="text-xs text-[#556353] dark:text-white/70 mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#245B3A]">local_shipping</span>
                  <span>Ekspedisi: <strong className="text-[#14331C] dark:text-white">{result.expedisi || 'Reguler'}</strong></span>
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-[#EAF6E8] dark:bg-[#152718] border border-[#245B3A]/30 text-xs font-bold text-[#245B3A] dark:text-[#86EFAC] flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#245B3A] dark:bg-[#86EFAC] animate-pulse inline-block" />
                {result.status || 'Sedang Dikirim'}
              </span>
            </div>

            {/* Shipper & Receiver */}
            {(result.pengirim || result.tujuan) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F9FBF7] dark:bg-[#152718] p-4 rounded-2xl border border-[#E2EFE0] dark:border-white/10">
                <div>
                  <span className="text-[#556353] dark:text-white/50 block mb-0.5">{t('Pengirim', 'Shipper')}</span>
                  <p className="font-bold text-sm text-[#14331C] dark:text-white">{result.pengirim || 'Bestari Sorgum Official'}</p>
                </div>
                <div>
                  <span className="text-[#556353] dark:text-white/50 block mb-0.5">{t('Tujuan Pengiriman', 'Destination')}</span>
                  <p className="font-bold text-sm text-[#14331C] dark:text-white">{result.tujuan || '-'}</p>
                </div>
              </div>
            )}

            {/* Journey Timeline */}
            <div>
              <h4 className="font-bold text-sm text-[#14331C] dark:text-white mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#245B3A]">timeline</span>
                <span>{t('Riwayat Perjalanan Paket', 'Package Timeline')}</span>
              </h4>

              {Array.isArray(result.perjalanan) && result.perjalanan.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#C5D8C1] dark:before:bg-white/20 pl-7">
                  {result.perjalanan.map((ev: any, i: number) => (
                    <div key={i} className="relative group">
                      <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#245B3A] dark:bg-[#86EFAC] ring-4 ring-white dark:ring-[#0E1A11]" />
                      <p className="text-[11px] font-mono text-[#556353] dark:text-white/50">{ev.tanggal || ev.event_date || '-'}</p>
                      <p className="text-xs sm:text-sm font-semibold text-[#14331C] dark:text-white mt-0.5">{ev.keterangan || ev.description || ''}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#556353] dark:text-white/60 italic p-3 bg-[#F9FBF7] dark:bg-[#122316] rounded-xl text-center">
                  {t('Belum ada pembaruan log perjalanan. Paket sedang disortir oleh pihak kurir.', 'No log updates yet. Package is being processed by the courier hub.')}
                </p>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── 3. Tiga Langkah Mudah Pelacakan (3-Pillar Information Cards) ── */}
      <div className="mb-14">
        <div className="text-center mb-6">
          <h2 className="font-['Plus_Jakarta_Sans'] text-lg sm:text-xl font-bold text-[#14331C] dark:text-white">
            {t('Cara Mudah Memantau Pesanan Anda', 'Easy Steps to Track Your Order')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#0E1A11] p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF6E8] dark:bg-[#152718] text-[#245B3A] dark:text-[#86EFAC] flex items-center justify-center mx-auto border border-[#245B3A]/20">
              <span className="material-symbols-outlined text-2xl">mark_chat_read</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#14331C] dark:text-white">
              1. {t('Dapatkan Resi via WhatsApp', 'Get Tracking from WhatsApp')}
            </h3>
            <p className="text-xs text-[#465444] dark:text-[#CBD5C8] leading-relaxed">
              {t('Admin kami mengirimkan nomor resi segera setelah pesanan Anda dipacking dan dipickup oleh kurir.', 'Admin will send your tracking code right after the package is packed and picked up.')}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0E1A11] p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF6E8] dark:bg-[#152718] text-[#245B3A] dark:text-[#86EFAC] flex items-center justify-center mx-auto border border-[#245B3A]/20">
              <span className="material-symbols-outlined text-2xl">sync_saved_locally</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#14331C] dark:text-white">
              2. {t('Pantau Status Real-Time', 'Real-time Tracking')}
            </h3>
            <p className="text-xs text-[#465444] dark:text-[#CBD5C8] leading-relaxed">
              {t('Cek posisi hub transit dan estimasi tiba di lokasi tujuan dengan akurat tanpa perlu membuka banyak aplikasi.', 'Check transit hubs and estimated arrival time accurately in one single page.')}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0E1A11] p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF6E8] dark:bg-[#152718] text-[#245B3A] dark:text-[#86EFAC] flex items-center justify-center mx-auto border border-[#245B3A]/20">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#14331C] dark:text-white">
              3. {t('Paket Tiba Segar & Aman', 'Package Arrives Safely')}
            </h3>
            <p className="text-xs text-[#465444] dark:text-[#CBD5C8] leading-relaxed">
              {t('Setiap kemasan sorgum dikemas dengan standar higienis dan kardus kokoh agar tiba dalam kualitas prima.', 'Each product is packed securely in sturdy boxes to ensure pristine quality upon arrival.')}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. WhatsApp Customer Service Support Banner ── */}
      <div className="bg-gradient-to-r from-[#14331C] to-[#245B3A] text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-extrabold leading-snug">
            {t('Resi Tidak Terlacak atau Paket Terkendala?', 'Tracking Code Issue or Shipment Delay?')}
          </h3>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            {t(
              'Tim admin Bestari siap membantu pengecekan langsung ke pihak ekspedisi untuk memastikan paket Anda sampai tepat waktu.',
              'Our team is ready to cross-check directly with couriers to ensure your package arrives promptly.'
            )}
          </p>
        </div>

        <a
          href={waHelpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md hover:shadow-xl transition-all shrink-0 cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-xl text-white">chat</span>
          <span>{t('Hubungi Admin via WA', 'Contact Admin via WA')}</span>
        </a>
      </div>

    </div>
  );
};

export default TrackingPage;
