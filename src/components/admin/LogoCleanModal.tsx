import React, { useEffect, useRef, useState } from 'react';
import { cleanLogo } from '../../utils/logoBackground';

interface LogoCleanModalProps {
  file: File;
  onCancel: () => void;
  /** Logo yang sudah bersih (PNG transparan persegi), siap diupload. */
  onConfirm: (cleaned: File) => void;
}

const PREVIEW = 260;

export const LogoCleanModal: React.FC<LogoCleanModalProps> = ({ file, onCancel, onConfirm }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [tolerance, setTolerance] = useState(40);
  const [includeInner, setIncludeInner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => setImg(el);
    el.onerror = () => setError('Gambar tidak bisa dibaca. Coba file lain.');
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Render ulang pratinjau tiap pengaturan berubah.
  useEffect(() => {
    if (!img || !previewRef.current) return;
    const result = cleanLogo(img, { enabled, tolerance, includeInner, size: PREVIEW * 2 });
    const c = previewRef.current;
    c.width = PREVIEW * 2;
    c.height = PREVIEW * 2;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(result, 0, 0);
  }, [img, enabled, tolerance, includeInner]);

  const handleConfirm = async () => {
    if (!img) return;
    setBusy(true);
    try {
      let size = 512;
      let blob: Blob | null = null;
      // PNG transparan biasanya kecil; kalau kebesaran, kecilkan bertahap.
      while (size >= 256) {
        const canvas = cleanLogo(img, { enabled, tolerance, includeInner, size });
        blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
        if (blob && blob.size <= 900 * 1024) break;
        size -= 128;
      }
      if (!blob) throw new Error('Gagal memproses logo');
      onConfirm(new File([blob], 'logo.png', { type: 'image/png' }));
    } catch (e: any) {
      setError(e?.message || 'Gagal memproses logo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#EAF6E8] dark:bg-[#0E1A11] rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xl p-5 space-y-4">
        <div>
          <h3 className="font-['Plus_Jakarta_Sans'] text-base font-extrabold text-[#14331C] dark:text-[#F4F8F3]">
            Bersihkan Background Logo
          </h3>
          <p className="text-[11px] text-[#556353] dark:text-white/60 mt-0.5">
            Background polos dihapus otomatis supaya logo bersih. Pola kotak-kotak berarti bagian itu transparan.
          </p>
        </div>

        <div
          className="mx-auto rounded-xl overflow-hidden border-2 border-[#3A8F4B]"
          style={{
            width: PREVIEW,
            height: PREVIEW,
            backgroundColor: '#4B6B52',
            backgroundImage:
              'conic-gradient(#4B6B52 25%, #5E8266 0 50%, #4B6B52 0 75%, #5E8266 0)',
            backgroundSize: '16px 16px',
          }}
        >
          {img ? (
            <canvas ref={previewRef} style={{ width: PREVIEW, height: PREVIEW, display: 'block' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-white/80">
              {error || 'Memuat gambar...'}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="accent-[#3A8F4B]"
            />
            Hapus background
          </label>

          <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#556353] dark:text-white/60 mb-1">
              <span>Kekuatan hapus</span>
              <span>{tolerance}</span>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={1}
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full accent-[#3A8F4B]"
            />
            <p className="text-[10px] text-[#556353] dark:text-white/50 mt-1">
              Kalau sisa background masih kelihatan, geser ke kanan. Kalau logonya ikut terkikis, geser ke kiri.
            </p>

            <label className="flex items-center gap-2 text-[11px] font-semibold text-[#556353] dark:text-white/70 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInner}
                onChange={(e) => setIncludeInner(e.target.checked)}
                className="accent-[#3A8F4B]"
              />
              Hapus juga background di dalam logo (mis. lubang huruf)
            </label>
          </div>
        </div>

        {error && img && <p className="text-[11px] font-semibold text-[#D32F2F]">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg border border-[#E2EFE0] dark:border-white/10 text-[#556353] dark:text-white/70 text-xs font-semibold cursor-pointer hover:bg-[#D7EED3] dark:hover:bg-[#152718]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !img}
            className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] text-white px-4 py-1.5 rounded-lg font-semibold text-xs cursor-pointer disabled:opacity-60 active:scale-95"
          >
            {busy ? 'Memproses...' : 'Pakai Logo'}
          </button>
        </div>
      </div>
    </div>
  );
};
