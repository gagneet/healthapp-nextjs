import winston from "winston";
import "winston-daily-rotate-file";
import moment from "moment";
import os from "os";
import { AsyncLocalStorage } from "async_hooks";

// Trace context management
class TraceContext {
  static TRACE_HEADERS = [
    "x-request-id",
    "x-correlation-id",
    "x-b3-traceid",
    "x-b3-spanid",
    "x-b3-parentspanid",
    "traceparent",
    "tracestate",
    "uber-trace-id",
    "sw8",
    "baggage",
  ];

  constructor() {
    this.traceId = "";
    this.spanId = "";
    this.parentId = "";
    this.sampled = "1";
    this.baggage = new Map();
  }

  static fromHeaders(headers) {
    const context = new TraceContext();

    // Extract W3C Trace Context
    const traceParent = headers["traceparent"];
    if (traceParent) {
      const [version, traceId, spanId, flags] = traceParent.split("-");
      context.traceId = traceId;
      context.spanId = spanId;
      context.sampled = flags[0];
    }

    // Extract B3 headers (Zipkin format)
    context.traceId = headers["x-b3-traceid"] || context.traceId;
    context.spanId = headers["x-b3-spanid"] || context.spanId;
    context.parentId = headers["x-b3-parentspanid"] || "";

    // Extract baggage items
    const baggage = headers["baggage"];
    if (baggage) {
      baggage.split(",").forEach((item) => {
        const [key, value] = item.trim().split("=");
        context.baggage.set(key, value);
      });
    }

    return context;
  }

  toHeaders() {
    const headers = {};

    // W3C Trace Context
    if (this.traceId && this.spanId) {
      headers[
        "traceparent"
      ] = `00-${this.traceId}-${this.spanId}-0${this.sampled}`;
    }

    // B3 Headers
    if (this.traceId) headers["x-b3-traceid"] = this.traceId;
    if (this.spanId) headers["x-b3-spanid"] = this.spanId;
    if (this.parentId) headers["x-b3-parentspanid"] = this.parentId;

    // Baggage
    if (this.baggage.size > 0) {
      headers["baggage"] = Array.from(this.baggage.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join(",");
    }

    return headers;
  }

  generateNextSpan() {
    const nextContext = new TraceContext();
    nextContext.traceId = this.traceId;
    nextContext.parentId = this.spanId;
    nextContext.spanId = generateSpanId();
    nextContext.sampled = this.sampled;
    nextContext.baggage = new Map(this.baggage);
    return nextContext;
  }
}

// Helper functions for trace ID generation
function generateTraceId() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function generateSpanId() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

// Enhanced Configuration with validation
const CONFIG = {
  environment: process.env.APP_ENV || process.env.NODE_ENV || "production",
  applicationName: process.env.APP_NAME || "AdhereLive",
  logDir: process.env.LOG_DIR || "logs",
  maxLogSize: process.env.MAX_LOG_SIZE || "20m",
  maxLogFiles: process.env.MAX_LOG_FILES || "14d",
  logLevel: process.env.LOG_LEVEL || "info",
  // Structured logging configuration
  structuredLogging: {
    enabled: process.env.STRUCTURED_LOGGING === "true",
    format: process.env.STRUCTURED_FORMAT || "json",
  },
  // Error tracking configuration
  errorTracking: {
    captureStackTrace: true,
    stackTraceLimit: 10,
    includeMetadata: true,
  },
  // Rate limiting configuration
  rateLimiting: {
    enabled: true,
    maxLogs: 1000,
    windowMs: 60000, // 1 minute
  },
  // Sampling configuration for high-volume logs
  sampling: {
    enabled: process.env.LOG_SAMPLING_ENABLED === "true",
    rate: parseFloat(process.env.LOG_SAMPLING_RATE || "0.1"), // 10% by default
  },
  // Distributed tracing configuration
  tracing: {
    enabled: process.env.TRACING_ENABLED === "true",
    serviceName: process.env.SERVICE_NAME || "unknown-service",
    serviceVersion: process.env.SERVICE_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "production",
    // Sampling specific to traces
    samplingRate: parseFloat(process.env.TRACE_SAMPLING_RATE || "1.0"),
    // External trace collector configuration
    collector: {
      enabled: process.env.TRACE_COLLECTOR_ENABLED === "true",
      endpoint: process.env.TRACE_COLLECTOR_ENDPOINT,
      headers: JSON.parse(process.env.TRACE_COLLECTOR_HEADERS || "{}"),
    },
  },
};

// Enhanced request context
class LogContext {
  constructor() {
    this.storage = new AsyncLocalStorage();
    this.contextData = new Map();
  }

  set(key, value) {
    const store = this.storage.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  get(key) {
    const store = this.storage.getStore();
    return store ? store.get(key) : undefined;
  }

  getAll() {
    const store = this.storage.getStore();
    return store ? Object.fromEntries(store) : {};
  }

  run(context, callback) {
    return this.storage.run(new Map(Object.entries(context)), callback);
  }
}

const logContext = new LogContext();

// Enhanced error handling
class LoggingError extends Error {
  constructor(message, code, metadata = {}) {
    super(message);
    this.name = "LoggingError";
    this.code = code;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }
}

// Rate limiting implementation
class RateLimiter {
  constructor(config) {
    this.enabled = config.enabled;
    this.maxLogs = config.maxLogs;
    this.windowMs = config.windowMs;
    this.logs = new Map(); // Store source -> array of timestamps

    // Add LRU cache for very high traffic scenarios
    this.maxSources = config.maxSources || 1000;
    if (this.logs.size > this.maxSources) {
      // Remove oldest source
      const oldestSource = this.logs.keys().next().value;
      this.logs.delete(oldestSource);
    }
  }

  shouldLog(source) {
    if (!this.enabled) return true;

    const now = Date.now();
    if (!this.logs.has(source)) {
      this.logs.set(source, [now]);
      return true;
    }

    // Get timestamps for this source and clean old ones
    let timestamps = this.logs.get(source);
    const windowStart = now - this.windowMs;

    // Remove timestamps outside the window
    // (efficient as array is naturally ordered)
    while (timestamps.length && timestamps[0] <= windowStart) {
      timestamps.shift();
    }

    // Check if we're under the limit
    if (timestamps.length < this.maxLogs) {
      timestamps.push(now);
      return true;
    }

    return false;
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [source, timestamps] of this.logs) {
      // Remove timestamps outside the window
      while (timestamps.length && timestamps[0] <= windowStart) {
        timestamps.shift();
      }
      // Remove empty sources
      if (timestamps.length === 0) {
        this.logs.delete(source);
      }
    }
  }
}

// Enhanced WinstonLogger class
class EnhancedWinstonLogger {
  static globalErrorHandlersAttached = false;

  constructor(filename) {
    this.source = filename;
    this.rateLimiter = new RateLimiter(CONFIG.rateLimiting);
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.rateLimiter.cleanup();
    }, 60000);
    this._setupLogger();
    this._setupErrorHandling();
  }

  // Don't forget to clear the interval when the logger is destroyed
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  // Helper function for circular references
  _getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (key === "socket" || key === "parser") return "[Circular]";
      if (value === null || value === undefined) return value;
      if (value instanceof Error) return value.stack || value.message;
      if (typeof value === "object" && value instanceof Buffer)
        return "[Buffer]";
      if (typeof value === "object" && value instanceof RegExp)
        return value.toString();
      if (typeof value === "function") return "[Function]";
      if (
        typeof value === "object" &&
        value.constructor &&
        value.constructor.name === "Socket"
      )
        return "[Socket]";
      if (
        typeof value === "object" &&
        value.constructor &&
        value.constructor.name === "HTTPParser"
      )
        return "[HTTPParser]";

      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    };
  }

  // Helper function to process log arguments
  _processLogArguments(message, args) {
    let additionalData;
    let error = null;

    // Handle arguments with circular reference safety
    if (args.length > 0) {
      if (args[0] instanceof Error) {
        error = args[0];
      } else {
        // Safely handle potential circular references in additionalData
        try {
          // Test if the object can be stringified
          JSON.stringify(args[0], this._getCircularReplacer());
          additionalData = args[0];
        } catch (err) {
          // If stringification fails, create a safe copy with basic properties
          if (typeof args[0] === "object") {
            additionalData = Object.keys(args[0]).reduce((acc, key) => {
              try {
                const value = args[0][key];
                if (typeof value !== "object" || value === null) {
                  acc[key] = value;
                } else {
                  acc[key] = "[Complex Object]";
                }
              } catch (e) {
                acc[key] = "[Unstringifiable]";
              }
              return acc;
            }, {});
          } else {
            additionalData = "[Unstringifiable Object]";
          }
        }
      }
    }

    return {
      additionalData,
      error,
      source: this.source,
    };
  }

  _setupLogger() {
    const enhancedFormat = winston.format.combine(
      winston.format.timestamp({
        format: () => moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(this._createLogFormatter())
    );

    const transports = this._createTransports();

    this.logger = winston.createLogger({
      level: CONFIG.logLevel,
      format: enhancedFormat,
      defaultMeta: { source: this.source },
      transports,
    });
  }

  _createLogFormatter() {
    return (info) => {
      const {
        level = "info",
        message = "",
        timestamp,
        additionalData,
        error,
        ...rest
      } = info;

      // Get the source from either the metadata or the logger instance
      const source = info.source || this.source || "unknown";

      // Helper function to handle circular references
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          // Handle special cases
          if (key === "socket" || key === "parser") return "[Circular]";
          if (value === null || value === undefined) return value;
          if (value instanceof Error) return value.stack || value.message;
          if (typeof value === "object" && value instanceof Buffer)
            return "[Buffer]";
          if (typeof value === "object" && value instanceof RegExp)
            return value.toString();
          if (typeof value === "function") return "[Function]";
          if (
            typeof value === "object" &&
            value.constructor &&
            value.constructor.name === "Socket"
          )
            return "[Socket]";
          if (
            typeof value === "object" &&
            value.constructor &&
            value.constructor.name === "HTTPParser"
          )
            return "[HTTPParser]";

          // Handle circular references
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return "[Circular]";
            }
            seen.add(value);
          }
          return value;
        };
      };

      // Format the message and any additional data
      let formattedMessage = message;

      try {
        // If we have additional data, append it to the message
        if (additionalData !== undefined) {
          if (typeof additionalData === "object") {
            formattedMessage = `${message}\n${JSON.stringify(
              additionalData,
              getCircularReplacer(),
              2
            )}`;
          } else {
            formattedMessage = `${message}${additionalData}`;
          }
        }

        // Handle error objects
        if (error) {
          if (error instanceof Error) {
            formattedMessage = `MESSAGE: ${message}\n${error.name}: ${
              error.message
            }\n${error.stack.split("\n").slice(1).join("\n")}`;
          } else {
            formattedMessage = `MESSAGE: ${message}\n${JSON.stringify(
              error,
              getCircularReplacer(),
              2
            )}`;
          }
        }

        // Truncate message if DEBUG_FULL is not YES
        // DEBUG_FULL controls log message length.
        // - "YES": Full log message is shown.
        // - "NO" (or unset): If message > 10 lines, shows first 5 and last 5 lines with a truncation indicator.
        //                    Otherwise, shows the full message.
        const debugFull = process.env.DEBUG_FULL || "NO";
        if (debugFull.toUpperCase() !== "YES") {
          const lines = formattedMessage.split("\n");
          if (lines.length > 10) {
            const firstFive = lines.slice(0, 5).join("\n");
            const lastFive = lines.slice(-5).join("\n");
            formattedMessage = `${firstFive}\n... (truncated बीच में) ...\n${lastFive}`;
          }
        }

        // Create the log entry
        const logEntry = {
          timestamp,
          level: level.replace(/\u001b\[\d+m/g, ""),
          message: formattedMessage,
        };

        // Return the formatted log entry with raw newlines
        return `[${source}]: ${JSON.stringify(
          logEntry,
          getCircularReplacer(),
          2
        )}`
          .replace(/\\n/g, "\n")
          .replace(/\\\"/g, '"');
      } catch (err) {
        // Fallback if JSON stringification fails
        return `[${source}]: {
                  "timestamp": "${timestamp}",
                  "level": "${level}",
                  "message": "Error formatting log message: ${err.message}. Original message: ${message}"
                  }`;
      }
    };
  }

  _createTransports() {
    const transports = [];

    // Console transport with enhanced formatting
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.uncolorize(),
          winston.format.printf((info) => {
            // Ensure newlines are preserved in console output
            const formatted = this._createLogFormatter()(info);
            return formatted.replace(/\\n/g, "\n").replace(/\\\"/g, '"');
          })
        ),
      })
    );

    // File transport with rotation (if needed)
    if (!this._isDevelopment()) {
      transports.push(
        new winston.transports.DailyRotateFile({
          dirname: CONFIG.logDir,
          filename: "application-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize: CONFIG.maxLogSize,
          maxFiles: CONFIG.maxLogFiles,
          format: winston.format.combine(
            winston.format.printf((info) => {
              const formatted = this._createLogFormatter()(info);
              return formatted.replace(/\\n/g, "\n").replace(/\\\"/g, '"');
            })
          ),
        })
      );
    }

    return transports;
  }

  _setupErrorHandling() {
    if (!EnhancedWinstonLogger.globalErrorHandlersAttached) {
      process.on("uncaughtException", (error) => {
        this.error("Uncaught Exception", { error, stack: error.stack });
        // It's generally recommended to let a process manager handle restarts.
        // Forcing process.exit(1) can lead to abrupt termination.
        // Consider logging the error and allowing the application to terminate gracefully
        // or rely on a process manager like PM2 or Kubernetes to restart the service.
        console.error("Uncaught Exception:", error); // Log to console as a fallback
        // process.exit(1); // Commented out to prevent abrupt termination
      });

      process.on("unhandledRejection", (reason, promise) => {
        this.error("Unhandled Rejection", { reason, promise });
        console.error("Unhandled Rejection at:", promise, "reason:", reason); // Log to console
      });

      EnhancedWinstonLogger.globalErrorHandlersAttached = true;
    }
  }

  _isDevelopment() {
    return CONFIG.environment === "development";
  }

  _shouldSample() {
    if (!CONFIG.sampling.enabled) return true;
    return Math.random() < CONFIG.sampling.rate;
  }

  _enrichMetadata(metadata = {}) {
    return {
      ...metadata,
      hostname: os.hostname(),
      pid: process.pid,
      ...logContext.getAll(),
    };
  }

  // Implement all log levels
  debug(message, ...args) {
    if (!this._shouldSample()) return;

    if (!this._debugRateLimitWarned) {
      this._debugRateLimitWarned = {};
    }

    if (!this.rateLimiter.shouldLog(this.source)) {
      // Optional: track dropped logs count
      this._incrementDroppedLogs();
      // Output a warning only if it hasn't been done for this source in this window
      if (!this._debugRateLimitWarned[this.source]) {
        this.warn("Rate limit exceeded for debug logs", { source: this.source });
        this._debugRateLimitWarned[this.source] = true;
      }
      return;
    } else {
      // Reset the warning flag for this source if logging is allowed again
      if (this._debugRateLimitWarned[this.source]) {
        this._debugRateLimitWarned[this.source] = false;
      }
    }

    const processedArgs = this._processLogArguments(message, args);
    this.logger.debug(message, processedArgs);
  }

  info(message, ...args) {
    if (!this._shouldSample()) return;
    const processedArgs = this._processLogArguments(message, args);
    this.logger.info(message, processedArgs);
  }

  warn(message, ...args) {
    const processedArgs = this._processLogArguments(message, args);
    this.logger.warn(message, processedArgs);
  }

  error(message, ...args) {
    const processedArgs = this._processLogArguments(message, args);
    this.logger.error(message, processedArgs);
  }

  // New method for structured logging
  structured(level, message, data = {}) {
    if (!CONFIG.structuredLogging.enabled) return;

    const structuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: logContext.getAll(),
      source: this.source,
      environment: CONFIG.environment,
    };

    this.logger.log(level, JSON.stringify(structuredLog));
  }

  // New method for performance logging
  performance(label, durationMs, metadata = {}) {
    this.info(`Performance: ${label}`, {
      ...metadata,
      duration_ms: durationMs,
      type: "performance",
    });
  }

  // New method for audit logging
  audit(action, details = {}) {
    this.info(`Audit: ${action}`, {
      ...details,
      type: "audit",
      timestamp: new Date().toISOString(),
      user: logContext.get("userId"),
    });
  }

  // Trace-specific logging method
  trace(message, span = {}, metadata = {}) {
    if (!CONFIG.tracing.enabled) return;

    const context = logContext.getAll();
    const traceData = {
      trace_id: context.traceId,
      span_id: context.spanId,
      parent_id: context.parentId,
      ...span,
      ...metadata,
    };

    this.structured("trace", message, traceData);

    // Send to trace collector if configured
    if (CONFIG.tracing.collector.enabled) {
      this._sendToCollector(traceData).catch((err) => {
        this.error("Failed to send trace to collector", { error: err });
      });
    }
  }

  // Optional: Track dropped logs
  _incrementDroppedLogs() {
    if (!this._droppedLogs) this._droppedLogs = 0;
    this._droppedLogs++;

    // Log a summary every 1000 dropped logs
    if (this._droppedLogs % 1000 === 0) {
      this.warn(
        `Dropped ${this._droppedLogs} debug logs due to rate limiting`,
        {
          source: this.source,
        }
      );
    }
  }

  async _sendToCollector(traceData) {
    if (!CONFIG.tracing.collector.endpoint) return;

    const payload = {
      ...traceData,
      service: CONFIG.tracing.serviceName,
      version: CONFIG.tracing.serviceVersion,
      environment: CONFIG.tracing.environment,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(CONFIG.tracing.collector.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...CONFIG.tracing.collector.headers,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new LoggingError("Trace collector error", "TRACE_COLLECTOR_ERROR", {
        error: error.message,
        endpoint: CONFIG.tracing.collector.endpoint,
      });
    }
  }
}

// Don't forget to clean up when your application shuts down
process.on("SIGTERM", () => {
  logger.destroy();
});

// Middleware for request tracking
export const requestMiddleware = (req, res, next) => {
  const startTime = Date.now();

  try {
    // Extract or create trace context
    let traceContext = TraceContext.fromHeaders(req.headers);

    // If no existing trace context, create a new one
    if (!traceContext.traceId) {
      traceContext = new TraceContext();
      traceContext.traceId = generateTraceId();
      traceContext.spanId = generateSpanId();
    }

    // Create child span for this request
    const requestSpan = traceContext.generateNextSpan();

    const context = {
      traceId: requestSpan.traceId,
      spanId: requestSpan.spanId,
      parentId: requestSpan.parentId,
      requestId: req.headers["x-request-id"] || requestSpan.spanId,
      method: req.method,
      path: req.path,
      userAgent: req.get("user-agent"),
      userId: req.user?.id,
      baggage: Object.fromEntries(requestSpan.baggage),
    };

    // Set response headers for distributed tracing
    const traceHeaders = requestSpan.toHeaders();
    Object.entries(traceHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Also set traditional correlation headers for backward compatibility
    res.setHeader("X-Request-ID", context.requestId);
    res.setHeader("X-Correlation-ID", context.requestId);
    logContext.run(context, () => {
      // Start span timing
      const spanStartTime = process.hrtime();

      // Capture response timing and details
      res.on("finish", () => {
        try {
          const [seconds, nanoseconds] = process.hrtime(spanStartTime);
          const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

          const logger = new EnhancedWinstonLogger("request-logger");
          logger.info("Request completed for Middleware", {
            statusCode: res.statusCode,
            duration,
            ...context,
          });
        } catch (error) {
          console.error(
            "Error in request for Middleware finish handler:",
            error
          );
        }
      });

      next();
    });
  } catch (error) {
    console.error("Error in request middleware:", error);
    next(error);
  }
};

// Export factory function
export const createLogger = (filename) => new EnhancedWinstonLogger(filename);

// Export context utilities
export const setLogContext = (key, value) => logContext.set(key, value);
export const getLogContext = (key) => logContext.get(key);
export const getTraceContext = () => {
  const context = logContext.getAll();
  return {
    traceId: context.traceId,
    spanId: context.spanId,
    parentId: context.parentId,
    baggage: context.baggage,
  };
};

// Create a global logger instance
const globalLogger = new EnhancedWinstonLogger("global");

// Export convenience methods using the global logger
export const debug = (...args) => globalLogger.debug(...args);
export const info = (...args) => globalLogger.info(...args);
export const warn = (...args) => globalLogger.warn(...args);
export const error = (...args) => globalLogger.error(...args);
export const performance = (...args) => globalLogger.performance(...args);
export const audit = (...args) => globalLogger.audit(...args);
export const structured = (...args) => globalLogger.structured(...args);
export const trace = (...args) => globalLogger.trace(...args);

// Export the global logger instance
export const logger = globalLogger;

// Create a stream object for Morgan (compatibility with existing code)
logger.stream = {
  write: (message) => {
    globalLogger.info(message.trim());
  }
};

// Default export
export default createLogger;