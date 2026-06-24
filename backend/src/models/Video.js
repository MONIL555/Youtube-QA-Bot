import mongoose from 'mongoose';

const MAX_TRANSCRIPT_LENGTH = 500_000; // ~500KB max transcript (covers ~4 hour videos)

const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true, index: true, match: /^[a-zA-Z0-9_-]{11}$/ },
  url: { type: String, required: true, match: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\// },
  title: { type: String, default: 'Unknown Title', maxlength: 500 },
  channel: { type: String, default: 'Unknown Channel', maxlength: 200 },
  duration: { type: Number, min: 0, max: 86400 }, // max 24 hours
  thumbnail: { type: String, maxlength: 500 },
  language: { type: String, default: 'en', maxlength: 10 },
  transcript: {
    type: String,
    required: true,
    maxlength: MAX_TRANSCRIPT_LENGTH,
  },
  transcriptChunks: {
    type: [{ type: String, maxlength: 5000 }],
    validate: {
      validator: function (arr) { return arr.length <= 200; },
      message: 'Too many transcript chunks',
    },
  },
  transcriptMethod: { type: String, enum: ['captions', 'whisper'], default: 'captions' },
  processedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-cleanup: remove video data not accessed for 30 days
videoSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('Video', videoSchema);
