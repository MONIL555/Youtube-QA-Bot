import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Token format validation — must look like a JWT (three dot-separated base64url segments)
const JWT_FORMAT = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    // Quick format check before doing any crypto work
    if (!JWT_FORMAT.test(token)) {
      return res.status(401).json({ success: false, error: 'Invalid token format' });
    }

    // NOTE: Access tokens are short-lived (15m) and NOT blacklisted.
    // Only refresh tokens go through blacklist rotation (in authController).
    // Removing the unnecessary TokenBlacklist.findOne() query here saves a DB call on every request.

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, error: 'User not found' });

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
