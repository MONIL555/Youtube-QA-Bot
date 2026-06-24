import { YoutubeTranscript } from 'youtube-transcript';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 3000; // characters per chunk for Gemini context
const YTDLP_TIMEOUT = 60_000;   // 60s for audio download
const WHISPER_TIMEOUT = 120_000; // 120s for transcription

// Strict YouTube URL validation — only allow known-safe URL patterns
const SAFE_YOUTUBE_URL = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}|youtu\.be\/[a-zA-Z0-9_-]{11}|youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}|youtube\.com\/embed\/[a-zA-Z0-9_-]{11})/;

const validateYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') throw new Error('Invalid URL');
  if (!SAFE_YOUTUBE_URL.test(url)) throw new Error('URL does not match allowed YouTube patterns');
};

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
  // Validate URL before passing to any subprocess
  validateYouTubeUrl(url);

  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const audioPath = path.join(tmpDir, `${uuidv4()}.mp3`);

    // Download audio with yt-dlp
    // '--' separates options from the URL to prevent option injection
    const ytdlp = spawn('yt-dlp', [
      '-x', '--audio-format', 'mp3',
      '--no-exec',          // prevent config-based command execution
      '--no-batch-file',    // prevent reading URLs from files
      '-o', audioPath,
      '--', url,            // '--' prevents URL from being parsed as an option
    ]);

    // Kill if it takes too long
    const ytdlpTimer = setTimeout(() => {
      ytdlp.kill('SIGTERM');
      reject(new Error('yt-dlp audio download timed out'));
    }, YTDLP_TIMEOUT);

    ytdlp.on('close', (code) => {
      clearTimeout(ytdlpTimer);
      if (code !== 0) return reject(new Error('yt-dlp audio download failed'));

      // Transcribe with Whisper — uses sys.argv to avoid string interpolation injection
      const whisper = spawn('python', [
        '-c',
        `import whisper, json, sys; model = whisper.load_model("base"); result = model.transcribe(sys.argv[1], task="transcribe"); print(json.dumps({"text": result["text"], "language": result["language"]}))`,
        audioPath,  // passed as sys.argv[1], never interpolated into the script
      ]);

      const whisperTimer = setTimeout(() => {
        whisper.kill('SIGTERM');
        fs.unlink(audioPath, () => {}); // cleanup
        reject(new Error('Whisper transcription timed out'));
      }, WHISPER_TIMEOUT);

      let output = '';
      whisper.stdout.on('data', d => output += d);
      whisper.on('close', (wCode) => {
        clearTimeout(whisperTimer);
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
