import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from './config';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(config.upload.dir)) {
      fs.mkdirSync(config.upload.dir, { recursive: true });
    }
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.'));
  }
}

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize },
}).single('image');

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize },
}).array('images', 5);
