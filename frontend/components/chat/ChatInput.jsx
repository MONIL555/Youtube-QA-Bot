'use client';
import { useState, useRef } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('English');
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim(), language);
    setText('');
    textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div style={{ padding: '0 12px 16px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={disabled}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '4px 0',
          }}
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Hindi">Hindi</option>
          <option value="Japanese">Japanese</option>
        </select>
      </div>
      <div className="glass" style={{
        padding: '10px 16px',
        margin: '0 auto',
        display: 'flex', gap: '12px', alignItems: 'flex-end',
        maxWidth: '1100px', width: '100%',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a question..."
          rows={1}
          style={{
            flex: 1, resize: 'none', background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)', fontSize: '15px', padding: '8px 4px',
            outline: 'none', lineHeight: 1.5, minHeight: '40px',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          style={{
            padding: '8px', flexShrink: 0,
            background: (disabled || !text.trim()) ? 'var(--bg-tertiary)' : 'var(--accent-gradient)',
            color: (disabled || !text.trim()) ? 'var(--text-muted)' : '#ffffff',
            border: 'none', borderRadius: '50%',
            width: '40px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: (disabled || !text.trim()) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: (disabled || !text.trim()) ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
        >
          {disabled ? '...' : '↑'}
        </button>
      </div>
    </div>
  );
}
