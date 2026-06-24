import { spawn } from 'child_process';

const YTDLP_TIMEOUT = 30_000; // 30s for metadata fetch

// Strict videoId validation — exactly 11 chars of [a-zA-Z0-9_-]
const SAFE_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

const validateVideoId = (videoId) => {
  if (!videoId || typeof videoId !== 'string' || !SAFE_VIDEO_ID.test(videoId)) {
    throw new Error('Invalid video ID format');
  }
};

export const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const fetchVideoMetadata = async (videoId) => {
  // Validate videoId format before constructing URL
  validateVideoId(videoId);

  return new Promise((resolve, reject) => {
    // Construct a safe URL from the validated videoId
    const safeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-download',
      '--no-exec',        // prevent config-based command execution
      '--no-batch-file',  // prevent reading URLs from files
      '--', safeUrl,      // '--' prevents URL from being parsed as an option
    ]);

    // Kill if it takes too long
    const timer = setTimeout(() => {
      ytdlp.kill('SIGTERM');
      reject(new Error('Metadata fetch timed out'));
    }, YTDLP_TIMEOUT);

    let output = '';
    ytdlp.stdout.on('data', d => output += d);
    ytdlp.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error('Failed to fetch video metadata'));
      try {
        const meta = JSON.parse(output);
        resolve({
          title: meta.title || 'Unknown Title',
          channel: meta.uploader || meta.channel || 'Unknown Channel',
          duration: meta.duration || 0,
          thumbnail: meta.thumbnail || '',
        });
      } catch { reject(new Error('Failed to parse metadata')); }
    });
  });
};
