import { spawn } from 'child_process';

const FORMAT_MAP = {
  '1080p': 'b[height<=1080][ext=mp4]/b[height<=1080]',
  '720p':  'b[height<=720][ext=mp4]/b[height<=720]',
  '480p':  'b[height<=480][ext=mp4]/b[height<=480]',
  '360p':  'b[height<=360][ext=mp4]/b[height<=360]',
  '240p':  'b[height<=240][ext=mp4]/b[height<=240]',
  'audio': 'bestaudio[ext=m4a]/bestaudio',
};

// Strict YouTube URL validation
const SAFE_YOUTUBE_URL = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}|youtu\.be\/[a-zA-Z0-9_-]{11}|youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}|youtube\.com\/embed\/[a-zA-Z0-9_-]{11})/;

const DOWNLOAD_TIMEOUT = 300_000; // 5 min max download time

export const streamDownload = (url, format, res, filename) => {
  // Validate URL before passing to subprocess
  if (!url || typeof url !== 'string' || !SAFE_YOUTUBE_URL.test(url)) {
    return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
  }

  // Validate format against whitelist
  const ytFormat = FORMAT_MAP[format];
  if (!ytFormat) {
    return res.status(400).json({ success: false, error: 'Invalid format' });
  }

  const ext = format === 'audio' ? 'm4a' : 'mp4';

  // Sanitize filename for Content-Disposition header (prevent header injection)
  const safeFilename = filename.replace(/[^a-z0-9_\- ]/gi, '_').slice(0, 50);
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.${ext}"`);
  res.setHeader('Content-Type', format === 'audio' ? 'audio/mp4' : 'video/mp4');

  const args = [
    '-f', ytFormat,
    '-o', '-',            // stream to stdout
    '--no-exec',          // prevent config-based command execution
    '--no-batch-file',    // prevent reading URLs from files
    '--', url,            // '--' prevents URL from being parsed as an option
  ];

  const ytdlp = spawn('yt-dlp', args);

  // Kill if download takes too long
  const timer = setTimeout(() => {
    ytdlp.kill('SIGTERM');
    if (!res.headersSent) {
      res.status(504).json({ success: false, error: 'Download timed out' });
    }
  }, DOWNLOAD_TIMEOUT);

  ytdlp.stdout.pipe(res);
  ytdlp.stderr.on('data', d => console.error('yt-dlp:', d.toString()));
  ytdlp.on('error', (err) => {
    clearTimeout(timer);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Download failed' });
    }
  });
  ytdlp.on('close', () => {
    clearTimeout(timer);
  });

  // Cleanup on client disconnect
  res.on('close', () => {
    clearTimeout(timer);
    ytdlp.kill('SIGTERM');
  });
};

export const getAvailableFormats = () => Object.keys(FORMAT_MAP);
