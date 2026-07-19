import express from 'express';
import { processFile, getHistory, upload } from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/process', upload.single('file'), processFile);
router.get('/history', getHistory);

export default router;
