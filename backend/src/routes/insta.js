import express from 'express';
import { processPost, getHistory, downloadPost } from '../controllers/instaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/process', processPost);
router.get('/history', getHistory);
router.get('/download', downloadPost);

export default router;
