import { Router } from 'express';
import { eventBus, EVENTS } from '../lib/eventBus';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/events/stream — Server-Sent Events untuk realtime sync.
// Client (FE AppContext) subscribe di sini. Setiap mutasi data (admin/user)
// publish event via eventBus → semua client terima event type → FE refetch
// data yang berubah → data admin == user tampil realtime.
//
// Teknis:
// - Content-Type text/event-stream, Cache-Control no-store, X-Accel-Buffering off
//   (biar nginx tidak buffer — krusial di prod, kalau dibuffer event tertunda).
// - Heartbeat comment tiap 25s: nginx proxy_read_timeout default 60s, kalau
//   tidak ada data selama >60s koneksi diputus. 25s aman.
// - Client disconnect (req.on('close')) → cleanup listener.
// ---------------------------------------------------------------------------
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx: jangan buffer SSE

  res.flushHeaders();

  // Kirim event initial biar client langsung tahu koneksi OK
  res.write(`event: connected\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);

  // Subscribe ke SEMUA event types (client FE filter sendiri)
  const unsubs = Object.values(EVENTS).map((eventType) =>
    eventBus.on(eventType, (payload) => {
      // SSE format: event: <type>\ndata: <json>\n\n
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
    })
  );

  // Heartbeat: komentar SSE (bukan event) biar koneksi tidak timeout di proxy
  const heartbeat = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`);
  }, 25000);

  // Cleanup saat client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    unsubs.forEach((u) => u());
  });

  // Kalau client kabur, jangan biarkan res.write error
  res.on('error', () => {
    clearInterval(heartbeat);
    unsubs.forEach((u) => u());
  });
});

export default router;
