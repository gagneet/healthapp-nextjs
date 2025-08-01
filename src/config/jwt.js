// src/config/jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export {
  JWT_SECRET,
  JWT_EXPIRE,
  JWT_REFRESH_EXPIRE,
  generateToken,
  generateRefreshToken,
  verifyToken,
};
