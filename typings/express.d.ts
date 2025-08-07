import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        userCategory: string;
        userRoleId?: string;
        permissions?: string[];
      };
      userCategory?: string;
    }
  }
}

export {};