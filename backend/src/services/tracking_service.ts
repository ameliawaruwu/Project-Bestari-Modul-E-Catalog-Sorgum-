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

const CEK_RESI_URL = 'http://localhost:3000/cek-resi';

export async function setTracking(orderId: number, courier: string, trackingNumber: string) {
  const [orderResult] = await dbPool.query(
    'UPDATE orders SET courier = ?, tracking_number = ?, order_status = ? WHERE id = ?',
    [courier, trackingNumber, 'shipped', orderId],
  );

  if ((orderResult as any).affectedRows === 0) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  await fetchTrackingStatus(orderId, courier, trackingNumber);
}

export async function fetchTrackingStatus(orderId: number, courier: string, trackingNumber: string) {
  let apiResponse: CekResiApiResponse;

  try {
    const res = await fetch(`${CEK_RESI_URL}/${trackingNumber}`);
    apiResponse = await res.json() as CekResiApiResponse;
  } catch {
    apiResponse = { status: 500 };
  }

  const outer = apiResponse.data;
  const isValid = outer?.valid === true && !!outer?.data;
  const resi = outer?.data;

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

  // Update order status if delivered
  if (resi?.status === 'DELIVERED') {
    await dbPool.query('UPDATE orders SET order_status = ? WHERE id = ?', ['delivered', orderId]);
  }

  return { isValid, status: resi?.status, expedisi: resi?.expedisi };
}

export async function getTrackingHistory(orderId: number) {
  const [history] = await dbPool.query(
    'SELECT event_date, description FROM tracking_history WHERE order_id = ? ORDER BY created_at ASC',
    [orderId],
  );

  const [latest] = await dbPool.query(
    `SELECT courier, tracking_number, resi_status, pengirim, tujuan, checked_at
     FROM tracking_logs WHERE order_id = ? ORDER BY checked_at DESC LIMIT 1`,
    [orderId],
  );

  return {
    tracking: (latest as any[])[0] || null,
    history: history as { event_date: string; description: string }[],
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
