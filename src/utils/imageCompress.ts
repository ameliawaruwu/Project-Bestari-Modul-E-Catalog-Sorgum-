/**
 * Kompres gambar di client sebelum upload.
 * - Resize ke max 800px (produk) / 512px (logo/QRIS) biar file kecil.
 * - Output JPEG (quality 0.82) → biasanya < 300KB → lolos nginx client_max_body_size
 *   (default 1MB) & multer limit, tanpa ngebloat DB.
 * - Fallback: kalau file asli sudah kecil (< 400KB), kirim asli (biar PNG tetap PNG).
 */
export async function compressImage(file: File, maxDim = 800, quality = 0.82): Promise<File> {
  // File kecil — kirim asli, tidak perlu kompres
  if (file.size < 400 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kompresi gagal'))), 'image/jpeg', quality);
    });
    bitmap.close();

    // Kalau hasil kompres malah lebih besar (png aneh) — pakai file asli
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    // createImageBitmap tidak didukung / gagal → kirim file asli
    return file;
  }
}
