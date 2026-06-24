import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/db.js';
import { globalLimiter } from './config/rateLimit.js';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/video.js';
import chatRoutes from './routes/chat.js';
import downloadRoutes from './routes/download.js';
import { errorHandler } from './middleware/errorHandler.js';

import fs from 'fs';
import path from 'path';

// ── Secure Logging ──────────────────────────────────────────────────────
const LOG_PATH = path.join(process.cwd(), 'error.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 MB

// Patterns that must NEVER appear in logs
const SENSITIVE_PATTERNS = [
  // API keys (Google, generic key= params)
  { regex: /key=([A-Za-z0-9_.\-]{10,})/gi, replacement: 'key=[REDACTED]' },
  { regex: /GEMINI_API_KEY\s*=\s*\S+/gi, replacement: 'GEMINI_API_KEY=[REDACTED]' },
  { regex: /api[_-]?key["']?\s*[:=]\s*["']?[A-Za-z0-9_.\-]{10,}/gi, replacement: 'api_key=[REDACTED]' },
  // MongoDB connection strings with credentials
  { regex: /mongodb(\+srv)?:\/\/[^@\s]+@/gi, replacement: 'mongodb$1://[CREDENTIALS_REDACTED]@' },
  // Bearer tokens & JWTs
  { regex: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi, replacement: 'Bearer [REDACTED]' },
  { regex: /eyJ[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}/g, replacement: '[JWT_REDACTED]' },
  // JWT secrets in env dumps
  { regex: /JWT_\w*SECRET\s*=\s*\S+/gi, replacement: 'JWT_SECRET=[REDACTED]' },
  // Passwords in strings
  { regex: /password["']?\s*[:=]\s*["']?[^\s"',}{]+/gi, replacement: 'password=[REDACTED]' },
  // Authorization headers in error dumps
  { regex: /authorization["']?\s*[:=]\s*["']?[^\s"',}{]+/gi, replacement: 'authorization=[REDACTED]' },
];

const sanitizeLogMessage = (msg) => {
  let sanitized = String(msg);
  for (const { regex, replacement } of SENSITIVE_PATTERNS) {
    // Reset regex lastIndex for global patterns
    regex.lastIndex = 0;
    sanitized = sanitized.replace(regex, replacement);
  }
  return sanitized;
};

// Rotate log if it exceeds MAX_LOG_SIZE
const rotateLogIfNeeded = () => {
  try {
    if (fs.existsSync(LOG_PATH)) {
      const stats = fs.statSync(LOG_PATH);
      if (stats.size > MAX_LOG_SIZE) {
        const backup = LOG_PATH.replace('.log', `.${Date.now()}.old.log`);
        fs.renameSync(LOG_PATH, backup);
      }
    }
  } catch { /* ignore rotation errors */ }
};

rotateLogIfNeeded();
const logFile = fs.createWriteStream(LOG_PATH, { flags: 'a' });
logFile.on('error', () => {}); // prevent crash on log write failure

const safeWrite = (prefix, data) => {
  const timestamp = new Date().toISOString();
  const raw = data instanceof Error ? data.stack || data.message : String(data);
  logFile.write(`[${timestamp}] ${prefix} ${sanitizeLogMessage(raw)}\n`);
};

process.on('uncaughtException', err => safeWrite('[Uncaught]', err));
process.on('unhandledRejection', err => safeWrite('[Unhandled]', err));
const originalError = console.error;
console.error = function(...args) {
  safeWrite('[Error]', args.join(' '));
  originalError.apply(console, args);
};

connectDB();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://i.ytimg.com", "https://*.ytimg.com"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Hide X-Powered-By
  hidePoweredBy: true,
  // Prevent MIME sniffing
  noSniff: true,
  // XSS filter
  xssFilter: true,
  // HSTS (only in production)
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(globalLimiter);

// Disable URL-encoded body (not needed, reduces attack surface)
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/download', downloadRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Catch-all for undefined routes (prevent information leakage)
app.all('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ── Graceful Shutdown ───────────────────────────────────────────────────
import mongoose from 'mongoose';

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB:', err.message);
    }
    logFile.end();
    process.exit(0);
  });
  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
