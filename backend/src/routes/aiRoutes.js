import express from 'express';
import { handleReview, handleOptimize, handleConvert, getAiQuota } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiters.js';
import {
  validateBody,
  reviewSchema,
  optimizeSchema,
  convertSchema,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// All AI operations require authentication and are rate-limited
router.use(requireAuth);
router.use(aiLimiter);

router.post('/review', validateBody(reviewSchema), handleReview);
router.post('/optimize', validateBody(optimizeSchema), handleOptimize);
router.post('/convert', validateBody(convertSchema), handleConvert);
router.get('/quota', getAiQuota);

export default router;
