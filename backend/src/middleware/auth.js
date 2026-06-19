import jwt from 'jsonwebtoken';
import TokenBlacklist from '../models/TokenBlacklist.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    // Check blacklist
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) return res.status(401).json({ success: false, error: 'Token revoked' });

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
