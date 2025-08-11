import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: Express Adapter Utility
 * 
 * This adapter is kept for reference but should be phased out in favor of
 * native Next.js API routes using the api-services.ts layer.
 * 
 * The new approach avoids Express compatibility layers and uses Next.js
 * native patterns for better performance and maintainability.
 */

/**
 * Express-to-NextJS Adapter Utility
 * 
 * This utility helps adapt existing Express.js routes and middleware
 * to work with Next.js 14 App Router API routes, preserving all
 * existing business logic, controllers, and middleware.
 */

// Types for Express-like objects
export interface ExpressRequest {
  body: any;
  query: any;
  params: any;
  user?: any;
  headers: Record<string, string>;
  method: string;
  url: string;
}

export interface ExpressResponse {
  status: (code: number) => ExpressResponse;
  json: (data: any) => NextResponse;
  send: (data: any) => NextResponse;
  setHeader: (key: string, value: string) => void;
}

/**
 * Creates Express-like request object from Next.js request
 */
export function createExpressRequest(request: NextRequest, params?: Record<string, string>): ExpressRequest {
  const url = new URL(request.url);
  
  return {
    body: null, // Will be populated by parseBody
    query: Object.fromEntries(url.searchParams.entries()),
    params: params || {},
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    url: request.url,
  };
}

/**
 * Creates Express-like response object that returns Next.js responses
 */
export function createExpressResponse(): ExpressResponse {
  let statusCode = 200;
  const headers = new Map<string, string>();
  
  const response: ExpressResponse = {
    status: (code: number) => {
      statusCode = code;
      return response;
    },
    json: (data: any) => {
      return NextResponse.json(data, { 
        status: statusCode,
        headers: Object.fromEntries(headers)
      });
    },
    send: (data: any) => {
      return new NextResponse(data, { 
        status: statusCode,
        headers: Object.fromEntries(headers)
      });
    },
    setHeader: (key: string, value: string) => {
      headers.set(key, value);
    }
  };

  return response;
}

/**
 * Parses request body for different content types
 */
export async function parseRequestBody(request: NextRequest): Promise<any> {
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    return await request.json();
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }
  
  return null;
}

/**
 * Main adapter function that wraps Express route handlers
 * for use in Next.js API routes
 */
export function adaptExpressRoute(
  handler: (req: ExpressRequest, res: ExpressResponse, next?: Function) => Promise<any> | any
) {
  return async function(request: NextRequest, context?: { params?: Record<string, string> }) {
    try {
      // Create Express-like objects
      const req = createExpressRequest(request, context?.params);
      const res = createExpressResponse();
      
      // Parse request body
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        req.body = await parseRequestBody(request);
      }
      
      // Call the Express route handler
      const result = await handler(req, res);
      
      // If handler returned a response directly, use it
      if (result instanceof NextResponse) {
        return result;
      }
      
      // Otherwise, return a success response
      return NextResponse.json({ success: true });
      
    } catch (error) {
      console.error('Express adapter error:', error);
      return NextResponse.json(
        { 
          status: false,
          statusCode: 500,
          payload: {
            error: {
              status: 'error',
              message: 'Internal server error'
            }
          }
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Adapter for Express middleware
 */
export function adaptExpressMiddleware(
  middleware: (req: ExpressRequest, res: ExpressResponse, next: Function) => Promise<any> | any
) {
  return async function(req: ExpressRequest, res: ExpressResponse): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const next = (error?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      };
      
      middleware(req, res, next);
    });
  };
}

/**
 * Applies multiple middleware functions in sequence
 */
export async function applyMiddleware(
  req: ExpressRequest,
  res: ExpressResponse,
  middlewares: Array<(req: ExpressRequest, res: ExpressResponse, next: Function) => any>
): Promise<boolean> {
  for (const middleware of middlewares) {
    const adaptedMiddleware = adaptExpressMiddleware(middleware);
    try {
      await adaptedMiddleware(req, res);
    } catch (error) {
      throw error;
    }
  }
  return true;
}

/**
 * Helper to extract route parameters from dynamic Next.js routes
 */
export function extractRouteParams(pathname: string, routePattern: string): Record<string, string> {
  const pathParts = pathname.split('/').filter(Boolean);
  const patternParts = routePattern.split('/').filter(Boolean);
  const params: Record<string, string> = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      const paramName = patternPart.slice(1, -1);
      params[paramName] = pathParts[i] || '';
    }
  }
  
  return params;
}