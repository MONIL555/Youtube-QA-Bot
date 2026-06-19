import Video from '../models/Video.js';
import { streamDownload, getAvailableFormats } from '../services/downloadService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getFormats = async (req, res, next) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) throw new AppError('Video not found', 404);
    res.json({ success: true, formats: getAvailableFormats() });
  } catch (err) { next(err); }
};

export const downloadVideo = async (req, res, next) => {
  try {
    const { format = '720p' } = req.query;
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) throw new AppError('Video not found', 404);

    const safeTitle = video.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
    streamDownload(video.url, format, res, safeTitle);
  } catch (err) { next(err); }
};
