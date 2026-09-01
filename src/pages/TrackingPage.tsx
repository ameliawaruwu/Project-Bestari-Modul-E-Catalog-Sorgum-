import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const TrackingPage: React.FC = () => {
  const { t } = useApp();
  const [resi, setResi] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resi.trim()) { setError('Masukkan nomor resi'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(resi.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Gagal melacak resi');
      if (json?.status === 500 || json?.error) throw new Error(json?.message || json?.error);
      const data = json?.data?.data || json?.data || json;
      if (json?.data?.valid === false) throw new Error('Resi tidak valid atau tidak ditemukan');
      setResult(data);
      try {
        const key = 'bestari_tracking_history';
        const hist = JSON.parse(localStorage.getItem(key) || '[]');
        const entry = { resi: resi.trim(), at: Date.now() };
        const next = [entry, ...hist.filter((h: any) => h.resi !== entry.resi)].slice(0, 10);
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    } catch (err: any) {
      setError(err?.message || 'Gagal melacak resi. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 md:px-10 max-w-2xl mx-auto min-h-screen animate-fadeIn">
      <div className="text-center mb-6">
        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1B5E20]">{t('Lacak Pesanan', 'Track Order')}</h1>
        <p className="text-sm text-[#555555] mt-2">{t('Masukkan nomor resi dari admin via WhatsApp.', 'Enter tracking number from admin via WhatsApp.')}</p>
      </div>

      <form onSubmit={handleCheck} className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#1B5E20] mb-1">Nomor Resi</label>
          <input value={resi} onChange={(e) => setResi(e.target.value)} placeholder="CGK123456789" className="w-full px-4 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#F7F8F6] text-sm font-mono font-bold text-[#1B5E20]" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50">
          {loading ? 'Melacak...' : t('Lacak Sekarang', 'Track Now')}
        </button>
      </form>

      {error && <div className="mt-6 p-4 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-sm text-[#D32F2F]">{error}</div>}

      {result && (
        <div className="mt-6 bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-[#888]">No Resi</p>
              <p className="font-mono font-bold text-[#1B5E20]">{result.noResi || result.tracking_number || resi}</p>
              <p className="text-xs text-[#888] mt-1">Ekspedisi: {result.expedisi || '-'}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-xs font-bold text-[#1B5E20]">{result.status || 'On Process'}</span>
          </div>

          {(result.pengirim || result.tujuan) && (
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#F7F8F6] p-3 rounded-xl border border-[#E0E0E0]">
              <div><span className="text-[#888]">Pengirim</span><p className="font-medium text-[#1B5E20]">{result.pengirim || '--'}</p></div>
              <div><span className="text-[#888]">Tujuan</span><p className="font-medium text-[#1B5E20]">{result.tujuan || '--'}</p></div>
            </div>
          )}

          <div>
            <h4 className="font-bold text-sm text-[#1B5E20] mb-2">Riwayat Perjalanan</h4>
            {Array.isArray(result.perjalanan) && result.perjalanan.length > 0 ? (
              <div className="space-y-2">
                {result.perjalanan.map((ev: any, i: number) => (
                  <div key={i} className="flex gap-3 text-xs py-2 border-b border-[#F0F0F0] last:border-0">
                    <span className="text-[#888] whitespace-nowrap text-[11px]">{ev.tanggal || ev.event_date || '-'}</span>
                    <span className="text-[#1B5E20]">{ev.keterangan || ev.description || ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#888]">Belum ada riwayat perjalanan.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
