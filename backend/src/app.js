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

const logFile = fs.createWriteStream(path.join(process.cwd(), 'error.log'), { flags: 'a' });
process.on('uncaughtException', err => logFile.write(`[Uncaught] ${err.stack}\n`));
process.on('unhandledRejection', err => logFile.write(`[Unhandled] ${err.stack}\n`));
const originalError = console.error;
console.error = function(...args) {
  logFile.write(`[Error] ${args.join(' ')}\n`);
  originalError.apply(console, args);
};

connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/download', downloadRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export default app;
