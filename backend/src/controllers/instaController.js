import InstaPost from '../models/InstaPost.js';
import { processInstaPost } from '../services/instaService.js';
import { streamDownload } from '../services/downloadService.js';
import { AppError } from '../middleware/errorHandler.js';

export const processPost = async (req, res, next) => {
  try {
    let { url } = req.body;
    if (!url) {
      return next(new AppError('Invalid Instagram URL', 400));
    }
    url = url.trim();
    
    // Looser validation: just check if it's an instagram URL
    if (!url.match(/^https?:\/\/(www\.)?instagram\.com\//)) {
      return next(new AppError('Invalid Instagram URL. Please ensure it starts with https://instagram.com/', 400));
    }

    // Call service to download, upload to Gemini, and generate summary
    const instaData = await processInstaPost(url);

    // Save post to DB
    const post = await InstaPost.create({
      userId: req.user.id,
      url,
      author: instaData.author,
      title: instaData.title,
      caption: instaData.caption,
      mediaType: instaData.mediaType,
      geminiFileUris: instaData.geminiFileUris,
      summary: instaData.summary,
      thumbnail: instaData.thumbnail
    });

    res.status(200).json({
      success: true,
      post: {
        id: post._id,
        url: post.url,
        summary: post.summary,
        mediaType: post.mediaType
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const posts = await InstaPost.find({ userId: req.user.id })
      .select('-geminiFileUris') // Don't expose internal URIs unnecessarily
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Format output to match frontend expectations (id or videoId)
    const formatted = posts.map(p => ({
      videoId: p._id, // Use videoId for VideoCard onClick key
      id: p._id,
      url: p.url,
      title: p.title || (p.summary && !p.summary.includes('processing') ? p.summary.substring(0, 70) + '...' : 'Instagram Post'),
      channel: p.author,
      thumbnail: p.thumbnail || (p.mediaType === 'video' 
        ? 'https://placehold.co/400x225/e1306c/ffffff?text=Instagram'
        : 'https://placehold.co/400x225/e1306c/ffffff?text=Instagram'),
      createdAt: p.createdAt,
      mediaType: p.mediaType
    }));

    res.status(200).json({ success: true, posts: formatted });
  } catch (err) {
    next(err);
  }
};

export const downloadPost = async (req, res, next) => {
  try {
    const { url } = req.query; 
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL required' });
    }

    const { snapsave } = await import('snapsave-media-downloader');
    const result = await snapsave(url);

    if (!result || !result.success || !result.data || !result.data.media || result.data.media.length === 0) {
      return res.status(400).json({ success: false, error: 'Failed to extract media for download' });
    }

    // Default to the first video found, or first image
    const media = result.data.media.find(m => m.type === 'video') || result.data.media[0];
    const filename = `InstaTalks_${Date.now()}${media.type === 'video' ? '.mp4' : '.jpg'}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', media.type === 'video' ? 'video/mp4' : 'image/jpeg');

    const https = await import('https');
    https.get(media.url, (response) => {
      response.pipe(res);
    }).on('error', (err) => {
      console.error('Download stream error:', err);
      res.end();
    });

  } catch (err) {
    console.error("Download post error:", err);
    res.status(500).json({ success: false, error: 'Failed to download post' });
  }
};
