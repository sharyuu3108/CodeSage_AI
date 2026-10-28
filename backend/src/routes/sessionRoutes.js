import express from 'express';
import {
  listSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  validateBody,
  sessionSchema,
  updateSessionSchema,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listSessions);
router.post('/', validateBody(sessionSchema), createSession);
router.get('/:id', getSession);
router.put('/:id', validateBody(updateSessionSchema), updateSession);
router.delete('/:id', deleteSession);

export default router;
