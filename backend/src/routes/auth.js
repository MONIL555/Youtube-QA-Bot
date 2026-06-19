import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../config/rateLimit.js';
import { protect } from '../middleware/auth.js';
import {
  register, login, refresh, logout, getMe
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authLimiter, [
  body('name').trim().notEmpty().isLength({ max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
], validate, register);

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, login);

router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
