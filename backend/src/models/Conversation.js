import mongoose from 'mongoose';

const MAX_MESSAGES = 200; // Cap messages per conversation to prevent unbounded growth

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 10000 },
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  videoId: { type: String, required: true, index: true, match: /^[a-zA-Z0-9_-]{11}$/ },
  messages: {
    type: [messageSchema],
    validate: {
      validator: function (arr) { return arr.length <= MAX_MESSAGES; },
      message: `Conversation cannot exceed ${MAX_MESSAGES} messages`,
    },
  },
}, { timestamps: true });

conversationSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Auto-cleanup: remove conversations inactive for 90 days
conversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('Conversation', conversationSchema);
