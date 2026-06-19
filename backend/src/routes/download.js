import express from 'express';
import { protect } from '../middleware/auth.js';
import { downloadLimiter } from '../config/rateLimit.js';
import { getFormats, downloadVideo } from '../controllers/downloadController.js';

const router = express.Router();
router.use(protect);

router.get('/formats/:videoId', getFormats);
router.get('/stream/:videoId', downloadLimiter, downloadVideo);

export default router;
