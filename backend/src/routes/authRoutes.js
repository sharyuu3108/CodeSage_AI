import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import {
  validateBody,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes with brute-force rate limiting
router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);

// Protected routes
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), updateProfile);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), changePassword);
router.delete('/account', requireAuth, validateBody(deleteAccountSchema), deleteAccount);

export default router;
