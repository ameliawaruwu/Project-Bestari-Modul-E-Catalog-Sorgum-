import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/jwt_utils';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token tidak ditemukan' });
    return;
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Akses ditolak. Hanya admin.' });
    return;
  }
  next();
}
