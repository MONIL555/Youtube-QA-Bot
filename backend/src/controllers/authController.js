import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { AppError } from '../middleware/errorHandler.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) throw new AppError('Email already registered', 409);

    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid credentials', 401);
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = generateTokens(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) { next(err); }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('No refresh token', 401);

    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) throw new AppError('Refresh token revoked', 401);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Rotate: blacklist old refresh token
    const expiry = new Date(decoded.exp * 1000);
    await TokenBlacklist.create({ token, expiresAt: expiry });

    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.id);
    setRefreshCookie(res, newRefresh);

    res.json({ success: true, accessToken });
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.decode(token);
      await TokenBlacklist.create({
        token,
        expiresAt: new Date((decoded?.exp || 0) * 1000),
      });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

export const getMe = (req, res) => {
  res.json({ success: true, user: req.user });
};
