import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { videoIdParam } from '../middleware/sanitize.js';
import { chatLimiter } from '../config/rateLimit.js';
import { sendMessage, getChatHistory, clearChatHistory, rateMessage, regenerateMessage } from '../controllers/chatController.js';

const router = express.Router();
router.use(protect);

router.post('/message', chatLimiter, [
  body('videoId').trim().notEmpty().matches(/^[a-zA-Z0-9_-]{11}$/),
  body('message').trim().notEmpty().isLength({ max: 1000 }),
  body('language').optional().isString().trim(),
], validate, sendMessage);

router.post('/regenerate', chatLimiter, [
  body('videoId').trim().notEmpty().matches(/^[a-zA-Z0-9_-]{11}$/),
  body('language').optional().isString().trim(),
], validate, regenerateMessage);

router.post('/feedback', [
  body('videoId').trim().notEmpty().matches(/^[a-zA-Z0-9_-]{11}$/),
  body('messageId').trim().notEmpty(),
  body('feedback').trim().isIn(['good', 'bad']),
], validate, rateMessage);


router.get('/history/:videoId', [videoIdParam], validate, getChatHistory);
router.delete('/history/:videoId', [videoIdParam], validate, clearChatHistory);

export default router;
