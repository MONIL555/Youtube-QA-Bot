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
