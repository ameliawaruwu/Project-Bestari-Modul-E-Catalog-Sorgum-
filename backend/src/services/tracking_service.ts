import dbPool from '../lib/db';
import { AppError } from '../lib/errors_utils';

interface PerjalananEvent {
  tanggal: string;
  keterangan: string;
}

interface ResiData {
  expedisi: string;
  noResi: string;
  pengirim: string;
  tujuan: string;
  status: string;
  tanggalKirim: string;
  penerima: string;
  perjalanan: PerjalananEvent[];
}

interface CekResiApiResponse {
  status: number;
  data?: {
    valid: boolean;
    data?: ResiData;
  };
}

const CEK_RESI_URL = process.env.CEK_RESI_URL || 'http://localhost:3001/cek-resi';

// cekresi.com gak pernah nyediain pengirim/tujuan (selalu "--")
// fallback: kurir admin = pengirim, alamat checkout = tujuan
function isTrackingEmpty(v: unknown): boolean {
  return v == null || v === '--' || v === '';
}

// cekresi pakai format DD/MM/YYYY HH:mm — JS Date gak bisa parse; ubah ke ISO utk FE
function normalizeEventDate(d: string | null | undefined): string | null {
  if (!d || d === '-' || d === '') return null;
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) return d; // bukan format yang kita kenal — biarin apa adanya
  const [, dd, mm, yyyy, hh, min] = m;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}${hh ? `T${hh.padStart(2, '0')}:${min}:00` : ''}`;
}

export async function setTracking(orderId: number, courier: string, trackingNumber: string) {
  // VALIDASI RESI DULU (sebelum update DB): cek-resi tidak bisa dipercaya 100%,
  // tapi setidaknya HTTP error / valid:false / data kosong harus ditolak — admin
  // wajib tahu resi gagal, bukan diam-diam sukses lalu pesanan berubah status.
  const validation = await validateResi(trackingNumber);

  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT order_status FROM orders WHERE id = ? FOR UPDATE',
      [orderId],
    );
    const order = (rows as any[])[0];
    if (!order) {
      await conn.rollback();
      throw new AppError('Pesanan tidak ditemukan', 404);
    }
    const terminal = ['delivered', 'cancelled'];
    if (terminal.includes(order.order_status)) {
      await conn.rollback();
      throw new AppError(
        `Tidak bisa set nomor resi: status pesanan saat ini "${order.order_status}" (terminal, tidak bisa diubah)`,
        400,
      );
    }

    await conn.query(
      'UPDATE orders SET courier = ?, tracking_number = ?, order_status = ?, shipped_at = COALESCE(shipped_at, NOW()) WHERE id = ?',
      [courier, trackingNumber, 'shipped', orderId],
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  // Simpan hasil validasi ke tracking_logs + history (status sebenarnya dari cek-resi).
  await persistTrackingResult(orderId, courier, trackingNumber, validation);
  return validation;
}

// Validasi resi ke layanan cek-resi. Return hasil parsing; THROW AppError kalau
// layanan down / HTTP error / resi tidak valid — supaya admin dapat pesan jelas.
async function validateResi(trackingNumber: string) {
  let apiResponse: CekResiApiResponse;
  let httpStatus = 200;
  try {
    const res = await fetch(`${CEK_RESI_URL}/${trackingNumber}`, { signal: AbortSignal.timeout(20000) });
    httpStatus = res.status;
    apiResponse = await res.json() as CekResiApiResponse;
  } catch {
    throw new AppError(
      'Layanan cek resi sedang bermasalah. Coba lagi beberapa saat — nomor resi belum disimpan.',
      502,
    );
  }

  if (httpStatus >= 400) {
    throw new AppError(
      'Nomor resi tidak valid atau tidak ditemukan di sistem ekspedisi. Periksa kembali nomor resi Anda.',
      400,
    );
  }

  const outer = apiResponse.data;
  const isValid = outer?.valid === true && !!outer?.data;
  const resi = outer?.data;
  if (!isValid || !resi?.noResi) {
    throw new AppError(
      'Nomor resi tidak valid atau tidak ditemukan di sistem ekspedisi. Periksa kembali nomor resi Anda.',
      400,
    );
  }

  return { isValid, status: resi.status, expedisi: resi.expedisi, resi, apiResponse };
}

async function persistTrackingResult(orderId: number, courier: string, trackingNumber: string, validation: Awaited<ReturnType<typeof validateResi>>) {
  const { isValid, resi, apiResponse } = validation;

  // Insert tracking log
  await dbPool.query(
    `INSERT INTO tracking_logs (order_id, courier, tracking_number, expedisi, resi_is_valid,
      resi_status, pengirim, tujuan, tanggal_kirim, penerima, raw_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId, courier, trackingNumber,
      resi?.expedisi || null,
      isValid ? 1 : 0,
      resi?.status || null,
      resi?.pengirim || null,
      resi?.tujuan || null,
      resi?.tanggalKirim || null,
      resi?.penerima || null,
      isValid ? JSON.stringify(apiResponse) : null,
    ],
  );

  // Insert tracking history
  if (isValid && resi?.perjalanan) {
    for (const event of resi.perjalanan) {
      await dbPool.query(
        `INSERT IGNORE INTO tracking_history (order_id, tracking_number, event_date, description)
         VALUES (?, ?, ?, ?)`,
        [orderId, trackingNumber, event.tanggal, event.keterangan],
      );
    }
  }

  // Update order status if delivered (case-insensitive — kurir beda format: Delivered/delivered/ON DELIVERY)
  if (isValid && resi?.status && String(resi.status).toUpperCase().includes('DELIVER')) {
    await dbPool.query('UPDATE orders SET order_status = ?, shipped_at = COALESCE(shipped_at, NOW()) WHERE id = ?', ['delivered', orderId]);
  }

  return { isValid, status: resi?.status, expedisi: resi?.expedisi };
}

export async function fetchTrackingStatus(orderId: number, courier: string, trackingNumber: string) {
  // Polling status resi — pakai validasi yang sama dengan setTracking supaya konsisten:
  // kalau cek-resi error / resi invalid, polling juga lempar error (admin diberi tahu).
  const validation = await validateResi(trackingNumber);
  return await persistTrackingResult(orderId, courier, trackingNumber, validation);
}

export async function getTrackingHistory(orderId: number) {
  const [history] = await dbPool.query(
    'SELECT event_date, description FROM tracking_history WHERE order_id = ? ORDER BY created_at ASC',
    [orderId],
  );

  const historyNorm = (history as any[]).map((h) => ({
    ...h,
    event_date: normalizeEventDate(h.event_date),
  }));

  const [latest] = await dbPool.query(
    `SELECT courier, tracking_number, resi_status, pengirim, tujuan, checked_at
     FROM tracking_logs WHERE order_id = ? ORDER BY checked_at DESC LIMIT 1`,
    [orderId],
  );

  const track = (latest as any[])[0] || null;

  // cekresi.com gak pernah nyediain pengirim/tujuan (selalu "--")
  // fallback: kurir admin = pengirim, alamat checkout = tujuan
  if (track) {
    if (isTrackingEmpty(track.pengirim)) {
      const [orderRows] = await dbPool.query(
        `SELECT courier, shipping_address FROM orders WHERE id = ?`,
        [orderId],
      );
      const order = (orderRows as any[])[0];
      if (order) {
        track.pengirim = order.courier || null;
        let addr = order.shipping_address;
        try { addr = typeof addr === 'string' ? JSON.parse(addr) : addr; } catch { addr = null; }
        if (isTrackingEmpty(track.tujuan)) {
          track.tujuan = addr
            ? [addr.recipient_name, addr.address_line, addr.district, addr.city, addr.province, addr.postal_code]
                .filter((v: unknown) => v && String(v).trim() !== '')
                .join(', ') || null
            : null;
        }
      }
    }

    // Update terakhir = event terakhir riwayat (bukan waktu poll) — kalau checked_at kosong
    if (!track.checked_at && historyNorm.length > 0) {
      track.checked_at = historyNorm[historyNorm.length - 1].event_date || null;
    }
  }

  return {
    tracking: track,
    history: historyNorm as { event_date: string; description: string }[],
  };
}

export async function manualPoll(orderId: number) {
  const [rows] = await dbPool.query(
    'SELECT courier, tracking_number FROM orders WHERE id = ?',
    [orderId],
  );
  const order = (rows as any[])[0];
  if (!order?.courier || !order?.tracking_number) {
    throw new AppError('Resi belum diinput untuk pesanan ini', 400);
  }

  return await fetchTrackingStatus(orderId, order.courier, order.tracking_number);
}
