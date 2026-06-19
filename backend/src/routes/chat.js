import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatLimiter } from '../config/rateLimit.js';
import { sendMessage, getChatHistory, clearChatHistory } from '../controllers/chatController.js';

const router = express.Router();
router.use(protect);

router.post('/message', chatLimiter, [
  body('videoId').notEmpty(),
  body('message').trim().notEmpty().isLength({ max: 2000 }),
], validate, sendMessage);

router.get('/history/:videoId', getChatHistory);
router.delete('/history/:videoId', clearChatHistory);

export default router;
