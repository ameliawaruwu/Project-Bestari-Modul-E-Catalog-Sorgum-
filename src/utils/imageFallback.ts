// Cadangan gambar global: beberapa gambar artikel memakai URL luar
// (mis. Wikimedia) yang sesekali gagal dimuat (rate limit). Tanpa ini kartu
// tampil sebagai kotak kosong. Satu listener (fase capture) menangani semua
// <img>: coba ulang sekali, lalu ganti dengan gambar placeholder bermerek.

const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">' +
      '<rect width="160" height="100" fill="#EEF3E8"/>' +
      '<path d="M80 30c-8 8-11 18-9 30 10 0 18-6 21-16-3-6-7-10-12-14z" fill="#B9CBB0"/>' +
      '<path d="M80 30c8 8 11 18 9 30-10 0-18-6-21-16 3-6 7-10 12-14z" fill="#9DB894"/>' +
      '<rect x="79" y="56" width="2" height="16" rx="1" fill="#9DB894"/>' +
    '</svg>',
  );

export function installImageFallback(): void {
  window.addEventListener(
    'error',
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:')) return;

      if (!img.dataset.retried) {
        img.dataset.retried = '1';
        setTimeout(() => {
          img.src = src + (src.includes('?') ? '&' : '?') + 'retry=1';
        }, 1200);
        return;
      }
      img.src = PLACEHOLDER;
    },
    true,
  );
}
