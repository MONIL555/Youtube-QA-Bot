import { param, query } from 'express-validator';

// YouTube videoId is always exactly 11 characters: [a-zA-Z0-9_-]
export const videoIdParam = param('videoId')
  .trim()
  .matches(/^[a-zA-Z0-9_-]{11}$/)
  .withMessage('Invalid video ID format');

// Download format must be one of the allowed values
export const formatQuery = query('format')
  .optional()
  .isIn(['1080p', '720p', '480p', '360p', '240p', 'audio'])
  .withMessage('Invalid download format');
