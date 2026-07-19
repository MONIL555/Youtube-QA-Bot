'use client';
import { Sparkles, Camera } from 'lucide-react';

export default function InstaInput({ url, setUrl, handleProcess, processing, urlInputRef }) {
  return (
    <div className="fade-in-up insta-input-container">
      <div className="input-wrapper">
        <input
          id="insta-url-input"
          ref={urlInputRef}
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleProcess()}
          placeholder="Paste Instagram Reel or Photo URL..."
          className="insta-input"
        />
        <button 
          id="analyze-insta-btn" 
          onClick={handleProcess} 
          disabled={processing}
          className="analyze-btn"
        >
          {processing ? 'Processing...' : (
            <>
              <span className="analyze-text">Analyze Post</span>
              <Camera size={18} />
            </>
          )}
        </button>
      </div>

      <style>{`
        .insta-input-container {
          padding: 8px;
          margin-bottom: 64px;
          width: 100%;
          max-width: 800px;
          border-radius: 24px;
          background: #FFFFFF;
          box-shadow: 0 20px 40px -12px rgba(236, 72, 153, 0.15), 0 0 0 1px rgba(236, 72, 153, 0.1);
        }

        .input-wrapper {
          display: flex;
          gap: 8px;
          position: relative;
        }

        .insta-input {
          flex: 1;
          padding: 16px 24px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 16px;
          outline: none;
          min-width: 0;
          text-overflow: ellipsis;
        }

        .analyze-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 16px;
          margin: 4px;
          padding: 0 32px;
          flex-shrink: 0;
          white-space: nowrap;
          font-size: 15px;
          font-weight: 600;
          background: linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
        }

        .analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);
        }

        .analyze-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background: #d1d5db;
          box-shadow: none;
        }

        .analyze-text { display: inline; }

        @media (max-width: 600px) {
          .analyze-text { display: none; }
          .analyze-btn { padding: 0 16px !important; gap: 0 !important; }
        }
      `}</style>
    </div>
  );
}
