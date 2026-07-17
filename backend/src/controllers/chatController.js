import Conversation from '../models/Conversation.js';
import Video from '../models/Video.js';
import { streamGeminiResponse } from '../services/geminiService.js';
import { AppError } from '../middleware/errorHandler.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { videoId, message, language = 'English' } = req.body;
    if (!message?.trim()) throw new AppError('Message is required', 400);

    const video = await Video.findOne({ videoId });
    if (!video) throw new AppError('Video not processed yet', 404);

    // Get or create conversation
    let convo = await Conversation.findOne({ userId: req.user._id, videoId });
    if (!convo) {
      convo = await Conversation.create({ userId: req.user._id, videoId, messages: [] });
    }

    // Save user message
    convo.messages.push({ role: 'user', content: message });
    await convo.save();

    // Stream response from Gemini
    const aiResponse = await streamGeminiResponse(
      video,
      convo.messages.slice(-21, -1), // last 20 messages before current
      message,
      res,
      language
    );

    // Save assistant response
    convo.messages.push({ role: 'assistant', content: aiResponse });
    await convo.save();
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Failed to complete response' })}\n\n`);
      res.end();
    }
  }
};



export const getChatHistory = async (req, res, next) => {
  try {
    const convo = await Conversation.findOne({
      userId: req.user._id,
      videoId: req.params.videoId,
    });
    res.json({ success: true, messages: convo?.messages || [] });
  } catch (err) { next(err); }
};

export const rateMessage = async (req, res, next) => {
  try {
    const { videoId, messageId, feedback } = req.body;
    if (!['good', 'bad'].includes(feedback)) throw new AppError('Invalid feedback', 400);

    const convo = await Conversation.findOne({ userId: req.user._id, videoId });
    if (!convo) throw new AppError('Conversation not found', 404);

    const message = convo.messages.id(messageId);
    if (!message) throw new AppError('Message not found', 404);

    message.feedback = feedback;
    await convo.save();

    res.json({ success: true, message: 'Feedback recorded' });
  } catch (err) { next(err); }
};

export const regenerateMessage = async (req, res, next) => {
  try {
    const { videoId, language = 'English' } = req.body;
    
    const video = await Video.findOne({ videoId });
    if (!video) throw new AppError('Video not processed yet', 404);

    const convo = await Conversation.findOne({ userId: req.user._id, videoId });
    if (!convo || convo.messages.length === 0) throw new AppError('No conversation to regenerate', 400);

    // Ensure the last message was from the assistant, then remove it
    if (convo.messages[convo.messages.length - 1].role === 'assistant') {
      convo.messages.pop();
    }
    
    // Check if there is a user message before it
    if (convo.messages.length === 0 || convo.messages[convo.messages.length - 1].role !== 'user') {
      throw new AppError('No user message to respond to', 400);
    }
    
    const lastUserMessage = convo.messages[convo.messages.length - 1].content;
    
    // We don't need to push the user message again because it's already in history
    await convo.save();

    // Stream response from Gemini
    const aiResponse = await streamGeminiResponse(
      video,
      convo.messages.slice(-20, -1), // last 19 messages (excluding the current one)
      lastUserMessage,
      res,
      language
    );

    // Save assistant response
    convo.messages.push({ role: 'assistant', content: aiResponse });
    await convo.save();
  } catch (err) {
    console.error('Regenerate error:', err.message);
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Failed to complete response' })}\n\n`);
      res.end();
    }
  }
};

export const clearChatHistory = async (req, res, next) => {
  try {
    await Conversation.findOneAndUpdate(
      { userId: req.user._id, videoId: req.params.videoId },
      { $set: { messages: [] } }
    );
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) { next(err); }
};
