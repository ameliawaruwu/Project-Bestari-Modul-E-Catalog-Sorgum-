import jwt from 'jsonwebtoken';
import { config } from './config';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}
