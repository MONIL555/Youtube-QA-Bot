import mongoose from 'mongoose';

const instaPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    default: 'Unknown',
  },
  title: {
    type: String,
    default: 'Instagram Post',
  },
  caption: {
    type: String,
    default: '',
  },
  mediaType: {
    type: String, // 'image', 'video', 'carousel'
    default: 'video',
  },
  geminiFileUris: [{
    type: String, // Array of URIs for carousels
  }],
  thumbnail: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    default: '',
  }
}, { timestamps: true });

// Index for faster queries by user
instaPostSchema.index({ userId: 1, createdAt: -1 });

const InstaPost = mongoose.model('InstaPost', instaPostSchema);

export default InstaPost;
