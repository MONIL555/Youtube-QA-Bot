import Video from '../models/Video.js';
import Conversation from '../models/Conversation.js';
import { extractVideoId, fetchVideoMetadata } from '../services/youtubeService.js';
import { extractTranscript } from '../services/transcriptService.js';
import { AppError } from '../middleware/errorHandler.js';

export const processVideo = async (req, res, next) => {
  try {
    const { url } = req.body;
    const videoId = extractVideoId(url);
    if (!videoId) throw new AppError('Invalid YouTube URL', 400);

    // Check cache
    let video = await Video.findOne({ videoId });
    if (video) {
      return res.json({ success: true, video, cached: true });
    }

    // Fetch metadata + transcript in parallel
    const [meta, transcriptData] = await Promise.all([
      fetchVideoMetadata(videoId),
      extractTranscript(videoId, url),
    ]);

    video = await Video.create({
      videoId, url,
      title: meta.title,
      channel: meta.channel,
      duration: meta.duration,
      thumbnail: meta.thumbnail,
      language: transcriptData.language,
      transcript: transcriptData.transcript,
      transcriptChunks: transcriptData.chunks,
      transcriptMethod: transcriptData.method,
    });

    res.status(201).json({ success: true, video, cached: false });
  } catch (err) { next(err); }
};

export const getVideoInfo = async (req, res, next) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) throw new AppError('Video not found', 404);
    res.json({ success: true, video });
  } catch (err) { next(err); }
};

export const getVideoHistory = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('videoId updatedAt');

    const videoIds = conversations.map(c => c.videoId);
    const videos = await Video.find({ videoId: { $in: videoIds } })
      .select('videoId title thumbnail channel duration');

    res.json({ success: true, videos });
  } catch (err) { next(err); }
};
