import express from 'express';
import { getProfile, getStats } from '../controllers/profileController.js';
import { updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody, updateProfileSchema } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getProfile);
router.put('/', validateBody(updateProfileSchema), updateProfile);
router.get('/stats', getStats);

export default router;
