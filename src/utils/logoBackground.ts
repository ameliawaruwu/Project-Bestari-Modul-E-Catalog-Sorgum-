/**
 * Bersihkan background polos dari logo (di browser, tanpa library).
 *
 * Cara kerja:
 * 1. Warna background = warna paling dominan di tepi gambar.
 * 2. Mulai dari tepi, hapus piksel yang warnanya mirip (dalam `tolerance`) dan
 *    menyambung ke tepi — jadi warna yang sama DI DALAM logo (mis. isi huruf)
 *    tidak ikut terhapus. `includeInner` mematikan aturan ini (hapus semua).
 * 3. Tepi hasil potongan dihaluskan sedikit supaya tidak bergerigi.
 * 4. Gambar dipangkas ke isi logonya lalu ditaruh di kanvas persegi transparan.
 */

export interface CleanLogoOptions {
  /** false = jangan hapus background (hanya dipangkas jadi persegi). */
  enabled: boolean;
  /** Seberapa mirip warna dianggap background (0–120). */
  tolerance: number;
  /** true = hapus juga warna background yang terkurung di dalam logo. */
  includeInner: boolean;
  /** Sisi hasil akhir (px). */
  size?: number;
}

const WORK_MAX = 800;

export function cleanLogo(img: HTMLImageElement, opts: CleanLogoOptions): HTMLCanvasElement {
  const size = opts.size ?? 512;
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;
  const s = Math.min(1, WORK_MAX / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * s));
  const h = Math.max(1, Math.round(ih * s));

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const wctx = work.getContext('2d', { willReadFrequently: true });
  if (!wctx) return work;
  wctx.drawImage(img, 0, 0, w, h);

  if (opts.enabled) {
    const imageData = wctx.getImageData(0, 0, w, h);
    removeBackground(imageData, opts.tolerance, opts.includeInner);
    wctx.putImageData(imageData, 0, 0);
  }

  // Cari kotak isi logo (piksel yang tidak transparan).
  const data = wctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    minX = 0; minY = 0; maxX = w - 1; maxY = h - 1; // semua terhapus → pakai utuh
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;

  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const octx = out.getContext('2d');
  if (!octx) return out;
  const pad = 0.06;
  const fit = size * (1 - pad * 2);
  const k = fit / Math.max(bw, bh);
  const dw = bw * k;
  const dh = bh * k;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(work, minX, minY, bw, bh, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return out;
}

function removeBackground(imageData: ImageData, tolerance: number, includeInner: boolean) {
  const { data, width: w, height: h } = imageData;
  const total = w * h;

  // 1) Warna background = bucket warna terbanyak di sepanjang tepi.
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 10) return;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += data[i]; e.g += data[i + 1]; e.b += data[i + 2];
    buckets.set(key, e);
  };
  for (let x = 0; x < w; x++) { sample(x, 0); sample(x, h - 1); }
  for (let y = 0; y < h; y++) { sample(0, y); sample(w - 1, y); }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  buckets.forEach((e) => { if (!best || e.n > best.n) best = e; });
  const bg = best
    ? { r: best.r / best.n, g: best.g / best.n, b: best.b / best.n }
    : { r: 255, g: 255, b: 255 };

  const dist = (i: number) => {
    const dr = data[i] - bg.r, dg = data[i + 1] - bg.g, db = data[i + 2] - bg.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };
  const isBg = (p: number) => data[p * 4 + 3] < 10 || dist(p * 4) <= tolerance;

  // 2) Tentukan piksel yang dihapus.
  const removed = new Uint8Array(total);
  if (includeInner) {
    for (let p = 0; p < total; p++) if (isBg(p)) removed[p] = 1;
  } else {
    const queue = new Int32Array(total);
    let head = 0, tail = 0;
    const push = (p: number) => {
      if (removed[p] || !isBg(p)) return;
      removed[p] = 1;
      queue[tail++] = p;
    };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (head < tail) {
      const p = queue[head++];
      const x = p % w;
      if (x > 0) push(p - 1);
      if (x < w - 1) push(p + 1);
      if (p >= w) push(p - w);
      if (p < total - w) push(p + w);
    }
  }

  // 3) Haluskan tepi: piksel tersisa yang menempel area terhapus dan masih agak
  //    mirip background dibuat setengah transparan (hindari halo/gerigi).
  const feather = new Map<number, number>();
  const soft = Math.max(1, tolerance * 0.8);
  for (let p = 0; p < total; p++) {
    if (removed[p]) continue;
    const x = p % w;
    const near =
      (x > 0 && removed[p - 1]) ||
      (x < w - 1 && removed[p + 1]) ||
      (p >= w && removed[p - w]) ||
      (p < total - w && removed[p + w]);
    if (!near) continue;
    const d = dist(p * 4);
    if (d < tolerance + soft) {
      feather.set(p, Math.round(255 * Math.min(1, Math.max(0, (d - tolerance) / soft))));
    }
  }
  for (let p = 0; p < total; p++) if (removed[p]) data[p * 4 + 3] = 0;
  feather.forEach((a, p) => { data[p * 4 + 3] = Math.min(data[p * 4 + 3], a); });
}
