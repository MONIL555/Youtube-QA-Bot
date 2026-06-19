import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { videoLimiter } from '../config/rateLimit.js';
import { processVideo, getVideoInfo, getVideoHistory } from '../controllers/videoController.js';

const router = express.Router();
router.use(protect);

router.post('/process', videoLimiter, [
  body('url').isURL().custom(value => {
    if (!value.includes('youtube.com') && !value.includes('youtu.be')) {
      throw new Error('Must be a valid YouTube URL');
    }
    return true;
  }),
], validate, processVideo);

router.get('/info/:videoId', getVideoInfo);
router.get('/history', getVideoHistory);

export default router;
