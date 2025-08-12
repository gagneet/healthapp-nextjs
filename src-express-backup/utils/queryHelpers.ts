import { ParsedQs } from 'qs';

// Exact Express query parameter type
export type QueryParam = string | ParsedQs | (string | ParsedQs)[] | undefined;

/**
 * Safely converts Express query parameter to string
 * Handles: string | ParsedQs | (string | ParsedQs)[] | undefined
 */
export function parseQueryParam(param: QueryParam): string {
  if (typeof param === 'string') {
    return param;
  }
  if (Array.isArray(param) && param.length > 0) {
    const first = param[0];
    return typeof first === 'string' ? first : String(first);
  }
  if (param && typeof param === 'object') {
    return String(param);
  }
  return '';
}

/**
 * Safely converts Express query parameter to number
 */
export function parseQueryParamAsNumber(param: QueryParam, defaultValue: number = 0): number {
  const str = parseQueryParam(param);
  const num = parseFloat(str);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely converts Express query parameter to integer
 */
export function parseQueryParamAsInt(param: QueryParam, defaultValue: number = 0): number {
  const str = parseQueryParam(param);
  const num = parseInt(str, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely converts Express query parameter to boolean
 */
export function parseQueryParamAsBoolean(param: QueryParam): boolean {
  const str = parseQueryParam(param).toLowerCase();
  return str === 'true' || str === '1' || str === 'yes';
}

/**
 * Safely converts Express query parameter to array of strings
 */
export function parseQueryParamAsArray(param: QueryParam): string[] {
  if (!param) return [];
  if (typeof param === 'string') return [param];
  if (Array.isArray(param)) {
    return param.map(item => typeof item === 'string' ? item : String(item));
  }
  return [String(param)];
}