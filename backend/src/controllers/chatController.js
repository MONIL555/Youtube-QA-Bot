import Conversation from '../models/Conversation.js';
import Video from '../models/Video.js';
import InstaPost from '../models/InstaPost.js';
import Document from '../models/Document.js';
import { streamGeminiResponse, streamGeminiInstaResponse, streamGeminiDocResponse } from '../services/geminiService.js';
import { AppError } from '../middleware/errorHandler.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { videoId, message, language = 'English' } = req.body;
    if (!message?.trim()) throw new AppError('Message is required', 400);

    let contextData = null;
    let contextType = null;

    // Check YouTube Video (11 chars)
    if (videoId.length === 11) {
      contextData = await Video.findOne({ videoId });
      if (contextData) contextType = 'video';
    } else if (videoId.length === 24) { // ObjectId length
      // Check InstaPost
      contextData = await InstaPost.findById(videoId);
      if (contextData) {
        contextType = 'insta';
      } else {
        // Check Document
        contextData = await Document.findById(videoId);
        if (contextData) contextType = 'doc';
      }
    }

    if (!contextData) throw new AppError('Content not processed yet or not found', 404);

    // Get or create conversation
    let convo = await Conversation.findOne({ userId: req.user._id, videoId });
    if (!convo) {
      convo = await Conversation.create({ userId: req.user._id, videoId, messages: [] });
    }

    // Save user message
    convo.messages.push({ role: 'user', content: message });
    await convo.save();

    // Stream response from Gemini based on context type
    let aiResponse;
    const history = convo.messages.slice(-21, -1);
    
    if (contextType === 'video') {
      aiResponse = await streamGeminiResponse(contextData, history, message, res, language);
    } else if (contextType === 'insta') {
      aiResponse = await streamGeminiInstaResponse(contextData, history, message, res, language);
    } else if (contextType === 'doc') {
      aiResponse = await streamGeminiDocResponse(contextData, history, message, res, language);
    }

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
    const convo = await Conversation.findOne({ userId: req.user._id, videoId: req.params.videoId });
    res.json({ success: true, messages: convo ? convo.messages : [] });
  } catch (err) { next(err); }
};

export const getContextInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    let contextData = null;
    let contextType = null;

    if (id.length === 11) {
      contextData = await Video.findOne({ videoId: id });
      if (contextData) contextType = 'video';
    } else if (id.length === 24) {
      contextData = await InstaPost.findById(id);
      if (contextData) {
        contextType = 'insta';
      } else {
        contextData = await Document.findById(id);
        if (contextData) contextType = 'doc';
      }
    }

    if (!contextData) {
      return next(new AppError('Content not found', 404));
    }

    let formattedVideo = contextData.toObject ? contextData.toObject() : { ...contextData };
    if (contextType === 'insta') {
      formattedVideo = {
        ...formattedVideo,
        title: contextData.title || (contextData.summary && !contextData.summary.includes('processing') ? contextData.summary.substring(0, 70) + '...' : 'Instagram Post'),
        channel: contextData.author,
        thumbnail: contextData.thumbnail || 'https://placehold.co/400x225/e1306c/ffffff?text=Instagram'
      };
    } else if (contextType === 'doc') {
      formattedVideo = {
        ...formattedVideo,
        title: contextData.summary && !contextData.summary.includes('processing') ? contextData.summary.substring(0, 70) + '...' : contextData.originalName,
        channel: 'Local Document',
        mediaType: 'document'
      };
    }

    res.json({ success: true, video: formattedVideo, type: contextType });
  } catch (err) {
    next(err);
  }
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
    
    let contextData = null;
    let contextType = null;

    if (videoId.length === 11) {
      contextData = await Video.findOne({ videoId });
      if (contextData) contextType = 'video';
    } else if (videoId.length === 24) { 
      contextData = await InstaPost.findById(videoId);
      if (contextData) {
        contextType = 'insta';
      } else {
        contextData = await Document.findById(videoId);
        if (contextData) contextType = 'doc';
      }
    }

    if (!contextData) throw new AppError('Content not processed yet or not found', 404);

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
    let aiResponse;
    const history = convo.messages.slice(-20, -1); // last 19 messages (excluding the current one)
    
    if (contextType === 'video') {
      aiResponse = await streamGeminiResponse(contextData, history, lastUserMessage, res, language);
    } else if (contextType === 'insta') {
      aiResponse = await streamGeminiInstaResponse(contextData, history, lastUserMessage, res, language);
    } else if (contextType === 'doc') {
      aiResponse = await streamGeminiDocResponse(contextData, history, lastUserMessage, res, language);
    }

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
