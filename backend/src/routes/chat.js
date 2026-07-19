import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { videoIdParam } from '../middleware/sanitize.js';
import { chatLimiter } from '../config/rateLimit.js';
import { sendMessage, getChatHistory, clearChatHistory, rateMessage, regenerateMessage, getContextInfo } from '../controllers/chatController.js';

const router = express.Router();
router.use(protect);

router.get('/info/:id', getContextInfo);

router.post('/message', chatLimiter, [
  body('videoId').trim().notEmpty(), // Can be 11-char YouTube ID or 24-char ObjectId
  body('message').trim().notEmpty().isLength({ max: 1000 }),
  body('language').optional().isString().trim(),
], validate, sendMessage);

router.post('/regenerate', chatLimiter, [
  body('videoId').trim().notEmpty(),
  body('language').optional().isString().trim(),
], validate, regenerateMessage);

router.post('/feedback', [
  body('videoId').trim().notEmpty(),
  body('messageId').trim().notEmpty(),
  body('feedback').trim().isIn(['good', 'bad']),
], validate, rateMessage);

router.get('/history/:videoId', validate, getChatHistory);
router.delete('/history/:videoId', validate, clearChatHistory);

export default router;
