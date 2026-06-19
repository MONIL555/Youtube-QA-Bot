import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true, index: true },
  url: { type: String, required: true },
  title: { type: String, default: 'Unknown Title' },
  channel: { type: String, default: 'Unknown Channel' },
  duration: { type: Number },
  thumbnail: { type: String },
  language: { type: String, default: 'en' },
  transcript: { type: String, required: true },
  transcriptChunks: [{ type: String }],
  transcriptMethod: { type: String, enum: ['captions', 'whisper'], default: 'captions' },
  processedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);
