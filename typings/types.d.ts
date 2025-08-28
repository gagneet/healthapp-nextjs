import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';

// Common utility types
export type StringOrNumber = string | number;
export type QueryValue = string | string[] | ParsedQs | ParsedQs[] | undefined;

// Helper function to safely convert query parameters to strings
export function parseQueryParam(param: QueryValue): string {
  if (typeof param === 'string') return param;
  if (typeof param === 'number') return param.toString();
  if (Array.isArray(param) && param.length > 0) {
    const first = param[0];
    return typeof first === 'string' ? first : String(first);
  }
  return '';
}

export function parseQueryParamAsNumber(param: QueryValue, defaultValue: number = 0): number {
  const str = parseQueryParam(param);
  const num = parseInt(str, 10);
  return isNaN(num) ? defaultValue : num;
}

// JWT Token payload interface
export interface TokenPayload {
  userId: string;
  email: string;
  userCategory: string;
  userRoleId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

// Common request interfaces
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    userCategory: string;
    userRoleId?: string;
    permissions?: string[];
  };
}

// Middleware function types
export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

// Error interfaces
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Database model interfaces (basic structure)
export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Response formatter types
export interface ApiResponse<T = any> {
  status: boolean;
  statusCode: number;
  payload: {
    data?: T;
    message?: string;
    error?: {
      status: string;
      message: string;
    };
  };
}

export {};