/**
 * @fileoverview Utility middleware for request logging, error handling, and input validation.
 * @module middleware/utils
 */

/**
 * HTTP request logger for development.
 * Logs method, URL, status code, and response time.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${req.method}\x1b[0m ${req.originalUrl} ${status} ${duration}ms`);
  });
  next();
}

/**
 * Centralized error handler.
 * Sends structured JSON error responses and prevents stack trace leaks in production.
 */
export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${statusCode} - ${message}`, err.stack ? `\n${err.stack}` : '');

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 handler for undefined API routes.
 */
export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

/**
 * Validates request body against a schema definition.
 * Schema format: { fieldName: { type: 'string'|'number'|'boolean'|'array', required: boolean } }
 *
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/endpoint', validateBody({ phone: { type: 'string', required: true } }), handler);
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
        if (rules.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        }
        if (rules.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        }
        if (rules.type === 'array' && !Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        }
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
}

/**
 * Sanitizes a string to prevent XSS.
 * Removes HTML tags and trims whitespace.
 *
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Wraps an async route handler to catch rejected promises.
 * Eliminates the need for try-catch in every route.
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
