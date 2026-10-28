import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

// Strict limiter for authentication endpoints (prevent brute-force password guessing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 10, // Max 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
  skip: () => isTest,
});

// General limiter for public API endpoints
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
    },
  },
  skip: () => isTest,
});

// AI operation limiter (cost control)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTest ? 10000 : 15, // Max 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.id ? req.user.id : req.ip),
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI operation rate limit exceeded. Please wait a minute before submitting again.',
    },
  },
  skip: () => isTest,
});
