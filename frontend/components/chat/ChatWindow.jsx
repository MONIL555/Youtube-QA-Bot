'use client';
import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, onFeedback, onRegenerate }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '16px 0',
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        maxWidth: '1200px', width: '100%', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '8px',
        padding: '0 12px'
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', textAlign: 'center', gap: '12px',
            marginTop: '100px'
          }}>
            <div style={{ fontSize: '48px' }}>🎬</div>
            <p style={{ fontSize: '16px' }}>Ask anything about this video</p>
            <p style={{ fontSize: '13px' }}>I'll only answer based on the video content.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble 
            key={msg._id || i} 
            message={msg} 
            isLatestAssistant={i === messages.length - 1 && msg.role === 'assistant'}
            onFeedback={onFeedback}
            onRegenerate={onRegenerate}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
