import { removeBackground } from './logoBackground';
import { compressImage } from './imageCompress';

/**
 * Bersihkan background foto produk sebelum upload → PNG transparan.
 *
 * - Background polos (putih/abu/warna rata di tepi foto) dihapus dengan cara
 *   yang sama seperti pembersih logo: hanya warna yang menyambung ke tepi,
 *   jadi warna sama di dalam produk/kemasan tidak ikut terhapus.
 * - Foto yang tepinya ramai (bukan background polos) tidak dihapus
 *   backgroundnya supaya produk tidak rusak — hanya diperkecil.
 * - Hasil dipangkas ke isi produk dan disimpan PNG (< 1 MB, batas upload).
 */

const TOLERANCE = 42;
const MAX_BYTES = 950 * 1024;

export async function cleanProductImage(file: File, maxDim = 800): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return compressImage(file, maxDim);
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const ctx = work.getContext('2d', { willReadFrequently: true });
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, w, h);
  if (hasPlainEdge(imageData)) {
    removeBackground(imageData, TOLERANCE, false);
    ctx.putImageData(imageData, 0, 0);
  }

  // Pangkas ke isi produk (piksel tidak transparan) + sedikit ruang.
  const d = imageData.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return file; // semua terhapus → foto asli saja
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04);
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;

  const name = file.name.replace(/\.[^.]+$/, '') + '.png';
  for (let k = 1; k >= 0.4; k -= 0.15) {
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(bw * k));
    out.height = Math.max(1, Math.round(bh * k));
    const octx = out.getContext('2d');
    if (!octx) return file;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(work, minX, minY, bw, bh, 0, 0, out.width, out.height);
    const blob = await new Promise<Blob | null>((r) => out.toBlob(r, 'image/png'));
    if (blob && blob.size <= MAX_BYTES) return new File([blob], name, { type: 'image/png' });
  }
  return compressImage(file, maxDim); // PNG tetap terlalu besar → JPEG terkompresi
}

// Tepi foto didominasi satu warna (background polos) atau sudah transparan?
function hasPlainEdge({ data, width: w, height: h }: ImageData): boolean {
  const px: number[] = [];
  for (let x = 0; x < w; x++) px.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) px.push(y * w, y * w + w - 1);
  let transparent = 0;
  const buckets = new Map<number, number>();
  for (const p of px) {
    const i = p * 4;
    if (data[i + 3] < 10) { transparent++; continue; }
    const key = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  let top = 0;
  buckets.forEach((n) => { if (n > top) top = n; });
  return transparent / px.length > 0.5 || top / px.length >= 0.55;
}
