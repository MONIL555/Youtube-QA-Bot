import { YoutubeTranscript } from 'youtube-transcript';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 3000; // characters per chunk for Gemini context

export const extractTranscript = async (videoId, url) => {
  // Strategy 1: Try YouTube captions
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    const text = items.map(i => i.text).join(' ');
    const language = items[0]?.lang || 'en';
    return {
      transcript: text,
      chunks: chunkText(text),
      method: 'captions',
      language,
    };
  } catch (captionErr) {
    console.log('Captions unavailable, falling back to Whisper:', captionErr.message);
  }

  // Strategy 2: yt-dlp audio download + Whisper transcription
  return await whisperFallback(videoId, url);
};

const whisperFallback = (videoId, url) => {
  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const audioPath = path.join(tmpDir, `${uuidv4()}.mp3`);

    // Download audio with yt-dlp
    const ytdlp = spawn('yt-dlp', [
      '-x', '--audio-format', 'mp3',
      '-o', audioPath,
      url,
    ]);

    ytdlp.on('close', (code) => {
      if (code !== 0) return reject(new Error('yt-dlp audio download failed'));

      // Transcribe with Whisper
      const whisper = spawn('python', ['-c', `
import whisper, json, sys
model = whisper.load_model("base")
result = model.transcribe("${audioPath}", task="transcribe")
print(json.dumps({"text": result["text"], "language": result["language"]}))
`]);

      let output = '';
      whisper.stdout.on('data', d => output += d);
      whisper.on('close', (wCode) => {
        fs.unlink(audioPath, () => {}); // cleanup
        if (wCode !== 0) return reject(new Error('Whisper transcription failed'));
        try {
          const parsed = JSON.parse(output.trim());
          resolve({
            transcript: parsed.text,
            chunks: chunkText(parsed.text),
            method: 'whisper',
            language: parsed.language || 'en',
          });
        } catch {
          reject(new Error('Failed to parse Whisper output'));
        }
      });
    });
  });
};

const chunkText = (text) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};
