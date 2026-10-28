import express from 'express';
import {
  getAggregatedHistory,
  getReviewsHistory,
  getOptimizationsHistory,
  getConversionsHistory,
  deleteHistoryItem,
  clearAllHistory,
} from '../controllers/historyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getAggregatedHistory);
router.get('/reviews', getReviewsHistory);
router.get('/optimizations', getOptimizationsHistory);
router.get('/conversions', getConversionsHistory);
router.delete('/:type/:id', deleteHistoryItem);
router.delete('/', clearAllHistory);

export default router;
