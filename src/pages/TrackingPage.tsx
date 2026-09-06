import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const TrackingPage: React.FC = () => {
  const { t, shopSettings } = useApp();
  const [resi, setResi] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [courier, setCourier] = useState('');
  const [courierOpen, setCourierOpen] = useState(false);
  const [courierSearch, setCourierSearch] = useState('');

  // Semua ekspedisi yang didukung cekresi.com (61) — sinkron dengan
  // https://cekresi.com/daftar-jasa-pengiriman/. 14 pertama = menu utama
  // cekresi.com, sisanya ekspedisi lain yang tetap bisa dilacak.
  // User WAJIB pilih ekspedisi (auto-detect dihapus, keputusan user 2026-09-04).
  const COURIER_OPTIONS: Array<{ code: string; label: string }> = [
    { code: 'JET', label: 'J&T Express' },
    { code: 'JNE', label: 'JNE Express' },
    { code: 'SPX', label: 'SPX / Shopee Express' },
    { code: 'JTCARGO', label: 'J&T Cargo' },
    { code: 'SICEPAT', label: 'SiCepat' },
    { code: 'LIONPARCEL', label: 'Lion Parcel' },
    { code: 'POS', label: 'Pos Indonesia' },
    { code: 'TIKI', label: 'TIKI' },
    { code: 'ANTERAJA', label: 'Anteraja' },
    { code: 'WAHANA', label: 'Wahana' },
    { code: 'INDAH', label: 'Indah Logistik Cargo' },
    { code: 'NINJA', label: 'Ninja Xpress' },
    { code: 'IDEXPRESS', label: 'ID Express' },
    { code: 'PAXEL', label: 'Paxel' },
    { code: 'ACOMMERCE', label: 'Acommerce' },
    { code: 'ANTARAN', label: 'Antaran Express' },
    { code: 'ARK', label: 'ARK Xpress' },
    { code: 'ASP', label: 'ASP Express' },
    { code: 'ATEX', label: 'AlfaTrex' },
    { code: 'BARAKA', label: 'Baraka Express' },
    { code: 'BEACUKAI', label: 'Luar Negeri / Bea Cukai' },
    { code: 'CHOIR', label: 'Choir / Fia Express' },
    { code: 'CITYLINK', label: 'CityLink Express' },
    { code: 'DUASATU', label: '21 Express' },
    { code: 'EMS', label: 'EMS' },
    { code: 'ESL', label: 'ESL Express' },
    { code: 'ETOBEE', label: 'Etobee' },
    { code: 'FIRST', label: 'First Logistics' },
    { code: 'GTL', label: 'GTL (GoTo Logistics)' },
    { code: 'HERONA', label: 'Herona Express' },
    { code: 'IKEA', label: 'IKEA' },
    { code: 'INDOPAKET', label: 'Indopaket' },
    { code: 'JANIO', label: 'Janio Asia' },
    { code: 'JDL', label: 'JDL Express' },
    { code: 'JETEXPRESS', label: 'JET Express' },
    { code: 'JX', label: 'JX / J-Express' },
    { code: 'KALOG', label: 'KALOG (KAI Logistik)' },
    { code: 'KERRY', label: 'Kerry Express' },
    { code: 'KGP', label: 'KGP (Kerta Gaya Pusaka)' },
    { code: 'KGX', label: 'KGXpress' },
    { code: 'LEX', label: 'Lazada Express' },
    { code: 'LWE', label: 'Standard Express / LWE' },
    { code: 'NCS', label: 'NCS' },
    { code: 'NEX', label: 'NEX' },
    { code: 'NSS', label: 'NSS Express' },
    { code: 'OEXPRESS', label: 'OExpress' },
    { code: 'PAHALA', label: 'Pahala Express' },
    { code: 'PCP', label: 'PCP Express' },
    { code: 'POSLAJU', label: 'PosLaju' },
    { code: 'QRIM', label: 'QRIM Express' },
    { code: 'QUANTIUM', label: 'Quantium Solutions' },
    { code: 'RCL', label: 'RCL Red Carpet Logistics' },
    { code: 'REX', label: 'REX Indonesia' },
    { code: 'ROSALIA', label: 'Rosalia Express' },
    { code: 'RPX', label: 'RPX Holding' },
    { code: 'SAP', label: 'SAP Express' },
    { code: 'SENTRALCARGO', label: 'Sentral Cargo' },
    { code: 'SF', label: 'SF Express' },
    { code: 'SKYNET', label: 'SkyNet' },
    { code: 'YATAMA', label: 'Yatama Air' },
    { code: 'ZDEX', label: 'ZDEX (Zalora)' },
  ];

  const trackResi = async (code: string, selectedCourier?: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t('Masukkan nomor resi pengiriman', 'Enter tracking number'));
      return;
    }
    if (!selectedCourier) {
      setError(t('Silakan pilih ekspedisi terlebih dahulu', 'Please select a courier first'));
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
              <span>{t('Ekspedisi', 'Courier')}</span>
            </label>

            {/* Tombol pilih ekspedisi */}
            <button
              type="button"
              onClick={() => { setCourierOpen(!courierOpen); setCourierSearch(''); }}
              className="w-full flex items-center justify-between gap-2 pl-4 pr-3 py-3.5 rounded-2xl border border-[#C5D8C1] dark:border-white/20 bg-[#F9FBF7] dark:bg-[#122316] text-sm text-[#14331C] dark:text-white font-semibold focus:outline-none focus:border-[#245B3A] dark:focus:border-[#86EFAC] transition-all cursor-pointer hover:border-[#245B3A]/60"
            >
              <span className="flex items-center gap-2 truncate">
                {courier ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#245B3A] dark:bg-[#86EFAC] shrink-0" />
                    <span className="truncate">
                      {COURIER_OPTIONS.find(c => c.code === courier)?.label || courier}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-[#556353] dark:text-white/60">
                    <span className="material-symbols-outlined text-base">local_shipping</span>
                    <span>{t('Pilih Ekspedisi', 'Select courier')}</span>
                  </span>
                )}
              </span>
              <span className={`material-symbols-outlined text-[#556353] dark:text-white/40 transition-transform ${courierOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {/* Panel pilih ekspedisi (collapsible) */}
            {courierOpen && (
              <div className="mt-2 rounded-2xl border border-[#C5D8C1] dark:border-white/20 bg-[#F9FBF7] dark:bg-[#122316] overflow-hidden animate-fadeIn">
                {/* Kolom pencarian */}
                <div className="p-2.5 border-b border-[#E2EFE0] dark:border-white/10 relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-[#556353] dark:text-white/40 pointer-events-none">
                    search
                  </span>
                  <input
                    autoFocus
                    value={courierSearch}
                    onChange={(e) => setCourierSearch(e.target.value)}
                    placeholder={t('Cari ekspedisi...', 'Search courier...')}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#C5D8C1]/70 dark:border-white/15 bg-white dark:bg-[#0E1A11] text-xs sm:text-sm text-[#14331C] dark:text-white placeholder:text-[#556353]/50 focus:outline-none focus:border-[#245B3A] dark:focus:border-[#86EFAC] transition-all"
                  />
                </div>

                {/* Daftar ekspedisi */}
                <div className="max-h-64 overflow-y-auto p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {COURIER_OPTIONS.filter(c =>
                    !courierSearch ||
                    c.label.toLowerCase().includes(courierSearch.toLowerCase()) ||
                    c.code.toLowerCase().includes(courierSearch.toLowerCase())
                  ).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setCourier(c.code); setCourierOpen(false); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer border ${
                        courier === c.code
                          ? 'bg-[#245B3A] text-white border-[#245B3A] dark:bg-[#245B3A] dark:text-white'
                          : 'bg-white dark:bg-[#0E1A11] text-[#14331C] dark:text-white border-[#E2EFE0] dark:border-white/10 hover:border-[#245B3A]/50'
                      }`}
                    >
                      <span className="truncate">{c.label}</span>
                      {courier === c.code && (
                        <span className="material-symbols-outlined text-sm shrink-0">check</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Jumlah ekspedisi */}
                <div className="px-4 py-2 border-t border-[#E2EFE0] dark:border-white/10 text-[10px] text-[#556353] dark:text-white/50 flex items-center justify-between">
                  <span>{t('Semua ekspedisi didukung cekresi.com', 'All couriers supported by cekresi.com')}</span>
                  <span>{COURIER_OPTIONS.length} {t('opsi', 'options')}</span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#556353] dark:text-white/50 mt-1.5">
              {t(
                'Pilih ekspedisi sesuai pengiriman Anda agar pelacakan akurat.',
                'Select the courier of your shipment for accurate tracking.'
              )}
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || !resi.trim()}
              className="inline-flex items-center justify-center gap-2 bg-[#245B3A] hover:bg-[#14331C] disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('Sedang Melacak...', 'Tracking Package...')}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">travel_explore</span>
                  <span>{t('Lacak Paket Sekarang', 'Track Package Now')}</span>
                </>
              )}
            </button>
          </div>
        </form>

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
                <div className="relative">
                  {/* Garis vertikal kontinu — center sejajar dengan bullet (left 4px + 1px = center 5px) */}
                  <span
                    aria-hidden
                    className="absolute left-[4px] top-[9px] bottom-[9px] w-0.5 bg-[#C5D8C1] dark:bg-white/20 rounded-full"
                  />
                  <div className="space-y-7">
                    {result.perjalanan.map((ev: any, i: number) => (
                      <div key={i} className="relative pl-9">
                        {/* Bullet point */}
                        <span className="absolute left-0 top-[4px] w-2.5 h-2.5 rounded-full bg-[#245B3A] dark:bg-[#86EFAC] ring-4 ring-white dark:ring-[#0E1A11]" />
                        <p className="text-[11px] font-mono text-[#556353] dark:text-white/50">{ev.tanggal || ev.event_date || '-'}</p>
                        <p className="text-xs sm:text-sm font-semibold text-[#14331C] dark:text-white mt-1">{ev.keterangan || ev.description || ''}</p>
                      </div>
                    ))}
                  </div>
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
