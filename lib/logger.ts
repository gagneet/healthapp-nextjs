/**
 * Enhanced Debug Logger for Frontend
 * Provides configurable debug logging that can be toggled on/off in production
 */

class FrontendLogger {
  private enabled: boolean;
  private prefix: string;

  constructor() {
    this.enabled = this.isDebugEnabled();
    this.prefix = '';
  }

  /**
   * Check if debug logging is enabled
   * Can be controlled via:
   * 1. Environment variable: NEXT_PUBLIC_DEBUG_LOGS
   * 2. localStorage: debug_logs
   * 3. URL parameter: debug=true
   */
  private isDebugEnabled(): boolean {
    // In SSR environment, return false to avoid issues
    if (typeof window === 'undefined') {
      return process.env.NODE_ENV === 'development';
    }

    // Check URL parameter first (highest priority)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      return true;
    }

    // Check localStorage (medium priority)
    try {
      const localStorageDebug = localStorage.getItem('debug_logs');
      if (localStorageDebug === 'true') {
        return true;
      }
    } catch (e) {
      // localStorage might not be available in some environments
    }

    // Check environment variable (lowest priority)
    return process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true' || process.env.NODE_ENV === 'development';
  }

  /**
   * Enable debug logging
   * Saves to localStorage for persistence
   */
  enableDebug(): void {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('debug_logs', 'true');
      } catch (e) {
        // localStorage might not be available
      }
    }
    this.info('Debug logging enabled');
  }

  /**
   * Disable debug logging
   * Removes from localStorage
   */
  disableDebug(): void {
    this.enabled = false;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('debug_logs');
      } catch (e) {
        // localStorage might not be available
      }
    }
    console.log('[Logger] Debug logging disabled');
  }

  /**
   * Toggle debug logging
   */
  toggleDebug(): boolean {
    if (this.enabled) {
      this.disableDebug();
    } else {
      this.enableDebug();
    }
    return this.enabled;
  }

  /**
   * Set a prefix for all log messages from this logger instance
   */
  setPrefix(prefix: string): void {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): FrontendLogger {
    const childLogger = new FrontendLogger();
    childLogger.enabled = this.enabled;
    childLogger.setPrefix(prefix);
    return childLogger;
  }

  /**
   * Debug level logging - only shows when debug is enabled
   */
  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`${this.prefix}[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info level logging - always shows
   */
  info(message: string, ...args: any[]): void {
    console.log(`${this.prefix}[INFO] ${message}`, ...args);
  }

  /**
   * Warning level logging - always shows
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix}[WARN] ${message}`, ...args);
  }

  /**
   * Error level logging - always shows
   */
  error(message: string, ...args: any[]): void {
    console.error(`${this.prefix}[ERROR] ${message}`, ...args);
  }

  /**
   * Performance timing utility
   */
  time(label: string): void {
    if (this.enabled) {
      console.time(`${this.prefix}[PERF] ${label}`);
    }
  }

  /**
   * End performance timing
   */
  timeEnd(label: string): void {
    if (this.enabled) {
      console.timeEnd(`${this.prefix}[PERF] ${label}`);
    }
  }

  /**
   * Group related logs together
   */
  group(label: string): void {
    if (this.enabled) {
      console.group(`${this.prefix}${label}`);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (this.enabled) {
      console.groupEnd();
    }
  }

  /**
   * Log the current debug status
   */
  getStatus(): any {
    const status = {
      enabled: this.enabled,
      prefix: this.prefix,
      environment: process.env.NODE_ENV,
      debugEnvVar: process.env.NEXT_PUBLIC_DEBUG_LOGS,
      localStorageValue: null as string | null,
      urlDebug: null as string | null
    };

    if (typeof window !== 'undefined') {
      try {
        status.localStorageValue = localStorage.getItem('debug_logs');
        status.urlDebug = new URLSearchParams(window.location.search).get('debug');
      } catch (e) {
        // Handle localStorage or window access issues
      }
    }

    return status;
  }
}

// Create a global logger instance
const logger = new FrontendLogger();

// Add global methods to enable/disable debug logging (only in browser)
if (typeof window !== 'undefined') {
  (window as any).enableDebugLogs = () => logger.enableDebug();
  (window as any).disableDebugLogs = () => logger.disableDebug();
  (window as any).toggleDebugLogs = () => logger.toggleDebug();
  (window as any).getDebugStatus = () => logger.getStatus();
}

// Export the logger
export default logger;

// Export convenience methods
export const debug = (...args: Parameters<typeof logger.debug>) => logger.debug(...args);
export const info = (...args: Parameters<typeof logger.info>) => logger.info(...args);
export const warn = (...args: Parameters<typeof logger.warn>) => logger.warn(...args);
export const error = (...args: Parameters<typeof logger.error>) => logger.error(...args);

// Export logger creation
export const createLogger = (prefix: string) => logger.child(prefix);