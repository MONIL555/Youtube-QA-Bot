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
  // Uses yt-dlp to get metadata (no API key needed)
  const { spawn } = await import('child_process');
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--dump-json', '--no-download',
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);
    let output = '';
    ytdlp.stdout.on('data', d => output += d);
    ytdlp.on('close', (code) => {
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
