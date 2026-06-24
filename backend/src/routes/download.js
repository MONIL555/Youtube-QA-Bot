import express from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { videoIdParam, formatQuery } from '../middleware/sanitize.js';
import { downloadLimiter } from '../config/rateLimit.js';
import { getFormats, downloadVideo } from '../controllers/downloadController.js';

const router = express.Router();
router.use(protect);

router.get('/formats/:videoId', [videoIdParam], validate, getFormats);
router.get('/stream/:videoId', downloadLimiter, [videoIdParam, formatQuery], validate, downloadVideo);

export default router;
