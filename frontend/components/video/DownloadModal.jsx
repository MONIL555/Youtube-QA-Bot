'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const FORMATS = [
  { label: '1080p HD', value: '1080p', icon: '🎬' },
  { label: '720p HD', value: '720p', icon: '📺' },
  { label: '480p SD', value: '480p', icon: '📱' },
  { label: '360p Low', value: '360p', icon: '💾' },
  { label: '240p Tiny', value: '240p', icon: '🔹' },
  { label: 'Audio', value: 'audio', icon: '🎵' },
];

export default function DownloadModal({ video, onClose }) {
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = async (format) => {
    setDownloading(format);
    toast.loading(`Preparing ${format} download...`, { id: 'dl' });
    try {
      const token = window.__accessToken;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/download/stream/${video.videoId}?format=${format}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' }
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title}_${format}.${format === 'audio' ? 'm4a' : 'mp4'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started!', { id: 'dl' });
    } catch {
      toast.error('Download failed', { id: 'dl' });
    } finally { setDownloading(null); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
    }} onClick={onClose}>
      <div className="glass fade-in-up" style={{ maxWidth: '440px', width: '100%', padding: '32px' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Download Video</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          {video.title}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {FORMATS.map(fmt => (
            <button
              key={fmt.value}
              onClick={() => handleDownload(fmt.value)}
              disabled={!!downloading}
              style={{
                padding: '14px', background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: downloading === fmt.value ? 'var(--accent-purple)' : 'var(--text-primary)',
                cursor: downloading ? 'not-allowed' : 'pointer',
                fontSize: '14px', textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{fmt.icon}</div>
              <div style={{ fontWeight: 600 }}>{fmt.label}</div>
              {downloading === fmt.value && <div style={{ fontSize: '11px', color: 'var(--accent-purple)', marginTop: '2px' }}>Downloading...</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
