import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const COOKIE_NAME = 'token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SEVEN_DAYS_MS,
});

/**
 * Attaches the JWT token to an HTTP-only SameSite cookie
 */
export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

/**
 * Clears the auth cookie using the identical path and options
 */
export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

/**
 * Generates signed JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Authentication Middleware:
 * Validates JWT in cookie, loads user from DB, and attaches to req.user
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in.',
        },
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      clearAuthCookie(res);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid authentication token.',
        },
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account no longer exists.',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication check failed.',
      },
    });
  }
};

/**
 * CSRF Protection Middleware:
 * Validates Origin/Referer on state-changing requests
 */
export const csrfProtection = (req, res, next) => {
  // Safe HTTP methods do not change state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // In test environment, skip Origin check unless specified
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  let isValid = false;
  if (origin && origin === clientUrl) {
    isValid = true;
  } else if (referer && referer.startsWith(clientUrl)) {
    isValid = true;
  }

  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_BLOCKED',
        message: 'Cross-site request blocked.',
      },
    });
  }

  next();
};
