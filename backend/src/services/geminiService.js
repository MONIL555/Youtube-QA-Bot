import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../middleware/errorHandler.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = (video, language) => `
You are a YouTube video Q&A assistant. Your ONLY job is to answer questions based strictly on the transcript of this video.

Rules:
1. ONLY use information from the transcript below. Never use external knowledge.
2. If the question cannot be answered from the transcript, respond EXACTLY: "I can only answer questions based on the content of this video."
3. Be concise, accurate, and helpful.
4. Reference specific parts of the transcript when relevant.
5. Maintain conversational context from the history provided.
6. ALWAYS answer in ${language}, regardless of the language of the video transcript or the user's question.

Video Title: ${video.title}
Channel: ${video.channel}
Detected Language: ${video.language}

Full Transcript:
${video.transcript}
`.trim();

export const streamGeminiResponse = async (video, history, userMessage, res, language = 'English') => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT(video, language),
  });

  // Build Gemini-compatible history and ensure strict alternating roles
  let rawHistory = history.slice(-20).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Sanitize: remove consecutive duplicate roles (keep the latest)
  const geminiHistory = [];
  for (let i = 0; i < rawHistory.length; i++) {
    if (i === rawHistory.length - 1 || rawHistory[i].role !== rawHistory[i + 1].role) {
      geminiHistory.push(rawHistory[i]);
    }
  }

  // Gemini history MUST NOT end with a 'model' role if the next message is from 'user'
  if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
    geminiHistory.pop();
  }


  const chat = model.startChat({
    history: geminiHistory,
  });

  const enforcedMessage = `${userMessage}\n\n[SYSTEM DIRECTIVE: You MUST respond entirely in ${language}. Do not use any other language, even if the video transcript is in another language.]`;
  
  let result;
  try {
    result = await chat.sendMessageStream(enforcedMessage);
  } catch (err) {
    if (err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('overloaded')) {
      throw new AppError('The AI model is currently experiencing high demand. Please try again in a few moments.', 503);
    }
    // Generic error for other failures to hide API URLs from the client
    console.error('Gemini API Error:', err.message);
    throw new AppError('Failed to communicate with the AI model. Please try again.', 502);
  }

  // SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullResponse += text;
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();

  return fullResponse;
};

// Generic helper for history formatting
const formatGeminiHistory = (history) => {
  let rawHistory = history.slice(-20).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const geminiHistory = [];
  for (let i = 0; i < rawHistory.length; i++) {
    if (i === rawHistory.length - 1 || rawHistory[i].role !== rawHistory[i + 1].role) {
      geminiHistory.push(rawHistory[i]);
    }
  }

  if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
    geminiHistory.pop();
  }
  return geminiHistory;
};

// --- InstaTalks ---
const INSTA_SYSTEM_PROMPT = (post, language) => `
You are an Instagram Q&A assistant. Your ONLY job is to answer questions based strictly on the provided Instagram content (image/video).
Rules:
1. ONLY use information visible or heard in the provided media. Never use external knowledge.
2. Be concise, accurate, and helpful.
3. ALWAYS answer in ${language}.

Post Author: ${post.author}
Caption (if any): ${post.caption}
`.trim();

export const streamGeminiInstaResponse = async (post, history, userMessage, res, language = 'English') => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: INSTA_SYSTEM_PROMPT(post, language),
  });

  const chat = model.startChat({ history: formatGeminiHistory(history) });

  const promptParts = [
    { text: `${userMessage}\n\n[SYSTEM DIRECTIVE: You MUST respond entirely in ${language}.]` }
  ];

  // Append all media URIs for context
  if (post.geminiFileUris && post.geminiFileUris.length > 0) {
    post.geminiFileUris.forEach(uri => {
      promptParts.push({
        fileData: { mimeType: post.mediaType === 'video' ? 'video/mp4' : 'image/jpeg', fileUri: uri }
      });
    });
  }

  let result;
  try {
    result = await chat.sendMessageStream(promptParts);
  } catch (err) {
    console.error('Gemini Insta API Error:', err.message);
    throw new AppError('Failed to communicate with the AI model. Media might still be processing.', 502);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullResponse += text;
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();

  return fullResponse;
};

// --- FileTalks ---
const DOC_SYSTEM_PROMPT = (doc, language) => `
You are a Document Q&A assistant. Your ONLY job is to answer questions based strictly on the provided document text.
Rules:
1. ONLY use information from the document text. Never use external knowledge.
2. If the question cannot be answered from the text, state that.
3. Be concise and accurate.
4. ALWAYS answer in ${language}.

Filename: ${doc.originalName}

Document Text:
${doc.extractedText}
`.trim();

export const streamGeminiDocResponse = async (doc, history, userMessage, res, language = 'English') => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: DOC_SYSTEM_PROMPT(doc, language),
  });

  const chat = model.startChat({ history: formatGeminiHistory(history) });

  const enforcedMessage = `${userMessage}\n\n[SYSTEM DIRECTIVE: You MUST respond entirely in ${language}.]`;

  let result;
  try {
    result = await chat.sendMessageStream(enforcedMessage);
  } catch (err) {
    console.error('Gemini Doc API Error:', err.message);
    throw new AppError('Failed to communicate with the AI model.', 502);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullResponse += text;
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();

  return fullResponse;
};
