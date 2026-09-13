import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  id: number;
  role: 'ADMIN' | 'USER';
  username: string;
}

export const signAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as any,
  };
  return jwt.sign(payload as object, config.jwt.secret as jwt.Secret, options);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as any,
  };
  return jwt.sign(payload as object, config.jwt.secret as jwt.Secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret as jwt.Secret) as JwtPayload;
};
