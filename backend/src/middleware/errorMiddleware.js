/**
 * Global centralized error-handling middleware
 * Ensures consistent response format without leaking stack traces
 */
export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle SyntaxError (e.g. malformed JSON in body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Invalid JSON payload received.',
      },
    });
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `An account with that ${field} already exists.`,
      },
    });
  }

  // Default server error
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, isProduction ? err.message : err);

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.userMessage || 'An unexpected error occurred. Please try again later.',
    },
  });
};
