// Express Request/Response type extensions
import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

// Extend Express Request interface to include user information
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload & {
      userId: string;
      email: string;
      role?: string;
      id: string;
      [key: string]: any;
    };
    userCategory?: string;
    fileValidationError?: string;
  }
}

// Common controller function types
export type ControllerFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response> | void | Response;

// Common API response structure
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

// Pagination interface
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
