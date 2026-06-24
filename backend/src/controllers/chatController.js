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

export const generateSummary = async (req, res, next) => {
  try {
    const { videoId } = req.body;
    const video = await Video.findOne({ videoId });
    if (!video) throw new AppError('Video not processed yet', 404);

    let convo = await Conversation.findOne({ userId: req.user._id, videoId });
    if (!convo) {
      convo = await Conversation.create({ userId: req.user._id, videoId, messages: [] });
    }

    const userMessage = "Please summarize this video.";
    convo.messages.push({ role: 'user', content: userMessage });
    await convo.save();

    const systemInstruction = "Please provide a comprehensive summary of this video. Use markdown formatting with bullet points and bold text to highlight key takeaways.";

    const aiResponse = await streamGeminiResponse(
      video,
      convo.messages.slice(-21, -1),
      systemInstruction,
      res
    );

    convo.messages.push({ role: 'assistant', content: aiResponse });
    await convo.save();
  } catch (err) {
    console.error('Summary error:', err.message);
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Failed to complete summary' })}\n\n`);
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

export const clearChatHistory = async (req, res, next) => {
  try {
    await Conversation.findOneAndUpdate(
      { userId: req.user._id, videoId: req.params.videoId },
      { $set: { messages: [] } }
    );
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) { next(err); }
};
