import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface JwtPayload {
  id: string;
  role: 'owner' | 'admin';
}

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

/** Sign a JWT for the given user id + role */
export const signToken = (id: Types.ObjectId | string, role: 'owner' | 'admin'): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign({ id: id.toString(), role }, getSecret(), { expiresIn });
};

/** Verify a JWT and return its payload (throws on invalid/expired token) */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getSecret()) as JwtPayload;
};
