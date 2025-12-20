import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  organizationId?: number; // Optional because legacy tokens might not have it, but new ones will
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};


