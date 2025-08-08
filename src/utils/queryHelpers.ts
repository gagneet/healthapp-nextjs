import { ParsedQs } from 'qs';

export type QueryValue = string | ParsedQs | (string | ParsedQs)[] | undefined;

/**
 * Safely converts query parameter to string
 */
export function parseQueryParam(param: QueryValue): string {
  if (typeof param === 'string') return param;
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
 * Safely converts query parameter to number
 */
export function parseQueryParamAsNumber(param: QueryValue, defaultValue: number = 0): number {
  const str = parseQueryParam(param);
  const num = parseInt(str, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely converts query parameter to boolean
 */
export function parseQueryParamAsBoolean(param: QueryValue): boolean {
  const str = parseQueryParam(param).toLowerCase();
  return str === 'true' || str === '1' || str === 'yes';
}

/**
 * Safely converts query parameter to array of strings
 */
export function parseQueryParamAsArray(param: QueryValue): string[] {
  if (!param) return [];
  if (typeof param === 'string') return [param];
  if (Array.isArray(param)) {
    return param.map(item => typeof item === 'string' ? item : String(item));
  }
  return [String(param)];
}