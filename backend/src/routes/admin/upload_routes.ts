import { Router, Request, Response } from 'express';
import { uploadSingle, uploadMultiple } from '../../lib/upload';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

function handleUploadError(err: any, req: Request, res: Response, next: any) {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File terlalu besar. Maksimal 5MB.' });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ error: 'Maksimal 5 file per upload.' });
      return;
    }
    res.status(400).json({ error: err.message || 'Gagal upload file' });
    return;
  }
  next();
}

router.post('/', (req: Request, res: Response, next: any) => {
  uploadSingle(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    if (!req.file) { res.status(400).json({ error: 'File wajib diupload' }); return; }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ message: 'Upload berhasil', data: { url, filename: req.file.filename } });
  });
});

router.post('/multiple', (req: Request, res: Response, next: any) => {
  uploadMultiple(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({ error: 'Minimal 1 file wajib diupload' });
      return;
    }
    const files = (req.files as Express.Multer.File[]).map(f => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
    }));
    res.status(201).json({ message: `${files.length} file berhasil diupload`, data: files });
  });
});

export default router;
