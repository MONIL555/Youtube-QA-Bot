import { spawn } from 'child_process';

const FORMAT_MAP = {
  '1080p': 'b[height<=1080][ext=mp4]/b[height<=1080]',
  '720p':  'b[height<=720][ext=mp4]/b[height<=720]',
  '480p':  'b[height<=480][ext=mp4]/b[height<=480]',
  '360p':  'b[height<=360][ext=mp4]/b[height<=360]',
  '240p':  'b[height<=240][ext=mp4]/b[height<=240]',
  'audio': 'bestaudio[ext=m4a]/bestaudio',
};

export const streamDownload = (url, format, res, filename) => {
  const ytFormat = FORMAT_MAP[format] || FORMAT_MAP['720p'];
  const ext = format === 'audio' ? 'm4a' : 'mp4';

  res.setHeader('Content-Disposition', `attachment; filename="${filename}.${ext}"`);
  res.setHeader('Content-Type', format === 'audio' ? 'audio/mp4' : 'video/mp4');

  const args = [
    '-f', ytFormat,
    '-o', '-', // stream to stdout
    url,
  ];

  const ytdlp = spawn('yt-dlp', args);
  ytdlp.stdout.pipe(res);
  ytdlp.stderr.on('data', d => console.error('yt-dlp:', d.toString()));
  ytdlp.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Download failed' });
    }
  });
};

export const getAvailableFormats = () => Object.keys(FORMAT_MAP);
