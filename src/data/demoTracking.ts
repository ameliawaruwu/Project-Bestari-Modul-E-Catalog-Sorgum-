// Data contoh untuk halaman "Lacak Paket".
//
// Halaman Lacak Paket aslinya memanggil layanan cek-resi eksternal (cekresi.com),
// sehingga saat presentasi hasilnya bergantung pada internet dan layanan pihak
// ketiga. Supaya demo selalu tampil sama dan tanpa internet, satu nomor resi
// contoh disimpan di sini sebagai data statis: begitu nomor ini diketik,
// kartunya langsung ditampilkan tanpa memanggil layanan apa pun.
//
// Nomor resi lain TIDAK terpengaruh — tetap dilacak live seperti biasa.

export interface TrackingEvent {
  tanggal: string;
  keterangan: string;
}

export interface TrackingResult {
  expedisi: string;
  noResi: string;
  pengirim: string;
  tujuan: string;
  status: string;
  tanggalKirim: string;
  penerima: string;
  perjalanan: TrackingEvent[];
}

// Nomor resi contoh (dibandingkan case-insensitive, spasi diabaikan).
export const DEMO_TRACKING_NUMBER = "SPXID062521925679";

// Isi kartu contoh — disalin apa adanya dari hasil pelacakan resi di atas.
export const DEMO_TRACKING_RESULT: TrackingResult = {
  "expedisi": "Shopee Express (SPX)",
  "noResi": "SPXID062521925679",
  "pengirim": "--",
  "tujuan": "--",
  "status": "Delivered",
  "tanggalKirim": "-",
  "penerima": "Pesanan tiba di alamat tujuan. diterima di Depan pintu. (Delivered)",
  "perjalanan": [
    {
      "tanggal": "30/09/2026 17:04",
      "keterangan": "Pesanan tiba di alamat tujuan. diterima di Depan pintu."
    },
    {
      "tanggal": "30/09/2026 15:33",
      "keterangan": "Pesanan dalam proses pengantaran."
    },
    {
      "tanggal": "30/09/2026 15:16",
      "keterangan": "Kurir sudah ditugaskan. Pesanan akan dikirim."
    },
    {
      "tanggal": "30/09/2026 13:26",
      "keterangan": "Pesanan diproses di lokasi transit Kota Bandung, Bandung Timur Hub."
    },
    {
      "tanggal": "30/09/2026 12:42",
      "keterangan": "Pesanan tiba di lokasi transit Kota Bandung, Bandung Timur Hub."
    },
    {
      "tanggal": "30/09/2026 11:53",
      "keterangan": "Pesanan dikirim dari lokasi sortir Kota Bandung Cinambo DC ke Kota Bandung, Bandung Timur Hub via darat dengan estimasi waktu 1 hari."
    },
    {
      "tanggal": "30/09/2026 08:30",
      "keterangan": "Pesanan telah disortir di Kota Bandung, Cinambo DC."
    },
    {
      "tanggal": "30/09/2026 08:29",
      "keterangan": "Pesanan diproses di lokasi sortir Kota Bandung, Cinambo DC."
    },
    {
      "tanggal": "30/09/2026 07:18",
      "keterangan": "Pesanan tiba di lokasi transit Kota Bandung, Cinambo DC."
    },
    {
      "tanggal": "30/09/2026 01:48",
      "keterangan": "Pesanan dikirim dari lokasi sortir Kab. Tangerang Transit Point Kosambi 2 DC ke Kota Bandung, Cinambo DC via darat dengan estimasi waktu 1 hari."
    },
    {
      "tanggal": "29/09/2026 18:42",
      "keterangan": "Pesanan telah disortir di Kab. Tangerang, Transit Point Kosambi 2 DC."
    },
    {
      "tanggal": "29/09/2026 18:42",
      "keterangan": "Pesanan diproses di lokasi sortir Kab. Tangerang, Transit Point Kosambi 2 DC."
    },
    {
      "tanggal": "29/09/2026 17:56",
      "keterangan": "Pesanan dikirim dari lokasi transit Kota Jakarta Utara, Penjaringan 18 First Mile Hub."
    },
    {
      "tanggal": "29/09/2026 17:15",
      "keterangan": "Pesanan diproses di lokasi transit Kota Jakarta Utara, Penjaringan 18 First Mile Hub."
    },
    {
      "tanggal": "29/09/2026 17:12",
      "keterangan": "Pesanan tiba di lokasi transit Kota Jakarta Utara, Penjaringan 18 First Mile Hub."
    },
    {
      "tanggal": "29/09/2026 15:32",
      "keterangan": "Pesanan telah diserahkan ke jasa kirim untuk diproses."
    },
    {
      "tanggal": "28/09/2026 12:15",
      "keterangan": "Kurir ditugaskan untuk menjemput pesanan."
    },
    {
      "tanggal": "28/09/2026 09:44",
      "keterangan": "Pengirim telah mengatur pengiriman. Menunggu pesanan diserahkan ke pihak jasa kirim."
    }
  ]
};

// Cek apakah sebuah nomor resi adalah resi contoh.
export function isDemoTrackingNumber(raw: string): boolean {
  return raw.replace(/\s+/g, '').toUpperCase() === DEMO_TRACKING_NUMBER;
}
