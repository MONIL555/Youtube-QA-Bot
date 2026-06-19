import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
});

// TTL index — MongoDB auto-deletes expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('TokenBlacklist', tokenBlacklistSchema);
