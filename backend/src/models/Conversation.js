import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  videoId: { type: String, required: true, index: true },
  messages: [messageSchema],
}, { timestamps: true });

conversationSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.model('Conversation', conversationSchema);
