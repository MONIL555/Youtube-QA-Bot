import React from 'react';
import { Play, FileText } from 'lucide-react';

export default React.memo(function VideoCard({ video, onClick, compact }) {
  return (
    <div
      className="glass"
      onClick={onClick}
      style={{
        padding: compact ? '8px' : '12px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', gap: '12px', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-secondary)'
      }}
    >
      {video.mediaType === 'document' ? (
        <div style={{
          width: compact ? '70px' : '120px',
          aspectRatio: '16/9',
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <FileText size={compact ? 24 : 32} color="var(--text-secondary)" />
        </div>
      ) : video.thumbnail && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={video.thumbnail} alt={video.title}
            style={{
              width: compact ? '70px' : '120px',
              aspectRatio: '16/9', objectFit: 'cover',
              borderRadius: '8px',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0,
            transition: 'opacity 0.2s', className: 'hover-play'
          }}>
            <Play size={20} color="#fff" fill="#fff" />
          </div>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
        <p style={{
          fontWeight: 600, fontSize: compact ? '13px' : '14px', color: 'var(--text-primary)',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: '4px', lineHeight: 1.3, letterSpacing: '-0.01em'
        }}>
          {video.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 400 }}>
            {video.channel}
          </p>
          {video.language && (
            <span style={{
              fontSize: '9px', padding: '2px 6px',
              background: 'rgba(139, 92, 246, 0.1)', borderRadius: '20px',
              color: 'var(--accent-purple)', border: '1px solid rgba(139, 92, 246, 0.2)',
              fontWeight: 600, letterSpacing: '0.05em'
            }}>
              {video.language.toUpperCase()}
            </span>
          )}
        </div>
      </div>
      
      {/* Add a subtle hover style override */}
      <style>{`
        .glass:hover .hover-play { opacity: 1 !important; }
      `}</style>
    </div>
  );
});
