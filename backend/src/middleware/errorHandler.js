export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Only log a short summary — full sanitization happens in the log writer
  console.error(`[${req.method} ${req.originalUrl}] ${statusCode}: ${err.message}`);

  // In production, never expose internal error messages for server errors
  const isOperational = err instanceof AppError;
  const clientMessage =
    process.env.NODE_ENV === 'production' && statusCode >= 500 && !isOperational
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
