'use client';
import { useState } from 'react';
import TypingIndicator from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Play, Square, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessageBubble({ message, isLatestAssistant, onFeedback, onRegenerate }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlay = () => {
    if (!message.content) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleFeedbackClick = (type) => {
    if (!message._id) return;
    if (onFeedback) onFeedback(message._id, type);
  };

  return (
      <div className="fade-in-up" style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 16px',
        background: isUser ? 'var(--bg-secondary)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        marginBottom: '12px',
        border: isUser ? '1px solid var(--glass-border)' : '1px solid transparent',
        position: 'relative',
      }}>
        {/* Message Header (Avatar + Name) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: isUser ? 'var(--bg-tertiary)' : 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', flexShrink: 0,
            color: isUser ? 'var(--text-secondary)' : '#fff',
            boxShadow: isUser ? 'none' : '0 2px 8px rgba(139, 92, 246, 0.25)'
          }}>
            {isUser ? '👤' : '✨'}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: isUser ? 'var(--text-muted)' : 'var(--accent-purple)' }}>
            {isUser ? 'You' : 'FIY-Talks AI'}
          </span>
        </div>

        {/* Message Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className={isUser ? '' : 'markdown-body'} style={{
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: 1.5,
            overflowX: 'auto',
          }}>
            {message.streaming && !message.content ? (
              <TypingIndicator />
            ) : isUser ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            )}
            
            {message.streaming && message.content && (
              <span style={{
                display: 'inline-block', width: '2px', height: '16px',
                background: 'var(--accent-purple)', marginLeft: '4px',
                animation: 'pulse 0.8s ease-in-out infinite', verticalAlign: 'middle',
              }} />
            )}
          </div>

          {/* Action Buttons Row (only for assistant messages) */}
          {!isUser && !message.streaming && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={handleCopy}
                title="Copy response"
                className="action-btn"
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  color: copied ? 'var(--success)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'color 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseOver={(e) => { if (!copied) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { if (!copied) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {copied ? <Check size={18} strokeWidth={1.5} /> : <Copy size={18} strokeWidth={1.5} />}
              </button>
              
              <button title={isPlaying ? "Stop" : "Read aloud"} className="action-btn"
                onClick={handlePlay}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  color: isPlaying ? 'var(--accent-purple)' : 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseOver={(e) => { if (!isPlaying) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { if (!isPlaying) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {isPlaying ? <Square size={16} strokeWidth={2} fill="currentColor" /> : <Play size={18} strokeWidth={1.5} />}
              </button>

              <button title="Good response" className="action-btn"
                onClick={() => handleFeedbackClick('good')}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  color: message.feedback === 'good' ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseOver={(e) => { if (message.feedback !== 'good') e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { if (message.feedback !== 'good') e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <ThumbsUp size={18} strokeWidth={1.5} fill={message.feedback === 'good' ? 'currentColor' : 'none'} />
              </button>

              <button title="Bad response" className="action-btn"
                onClick={() => handleFeedbackClick('bad')}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  color: message.feedback === 'bad' ? 'var(--error)' : 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseOver={(e) => { if (message.feedback !== 'bad') e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { if (message.feedback !== 'bad') e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <ThumbsDown size={18} strokeWidth={1.5} fill={message.feedback === 'bad' ? 'currentColor' : 'none'} />
              </button>

              {isLatestAssistant && (
                <button title="Regenerate response" className="action-btn"
                  onClick={onRegenerate}
                  style={{
                    background: 'transparent', border: 'none', padding: 0,
                    color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <RotateCcw size={18} strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}
        </div>
    </div>
  );
}
