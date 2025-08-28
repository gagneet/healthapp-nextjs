// src/config/jwt.js
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  userCategory: string;
  userRoleId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || '25af6001e43881f727388f44e0f6fff837510b0649fe9393987f009c595156f778442654270516863b00617b478aa46dea6311f74fb95325d3c9a344b125d033';
console.log('JWT_SECRET being used:', JWT_SECRET?.substring(0, 20) + '...');
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE } as jwt.SignOptions);
};

const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRE } as jwt.SignOptions);
};

const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token format');
  }
  return decoded as TokenPayload;
};

export {
  JWT_SECRET,
  JWT_EXPIRE,
  JWT_REFRESH_EXPIRE,
  generateToken,
  generateRefreshToken,
  verifyToken,
};
