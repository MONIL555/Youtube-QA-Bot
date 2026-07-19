'use client';
import { useRef, useState } from 'react';
import { UploadCloud, FileText, Upload, X } from 'lucide-react';

export default function FileInput({ file, setFile, handleProcess, processing }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fade-in-up file-input-container">
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileChange} 
          style={{ display: 'none' }} 
          accept=".pdf,.docx,.txt,.ppt,.pptx"
        />
        
        {file ? (
          <div className="file-info">
            <FileText size={32} color="var(--accent-cyan)" className="file-icon" />
            <div className="file-details">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="file-actions">
              <button className="clear-btn" onClick={handleClear} disabled={processing}>
                <X size={16} style={{ marginRight: '6px' }} />
                <span>Clear</span>
              </button>
              <button 
                className="analyze-btn" 
                onClick={(e) => { e.stopPropagation(); handleProcess(); }}
                disabled={processing}
              >
                <Upload size={18} className={processing ? "spinning" : ""} style={{ marginRight: '8px', marginBottom: '2px' }} />
                <span>{processing ? 'Uploading...' : 'Analyze'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="icon-circle">
              <UploadCloud size={28} />
            </div>
            <p className="prompt-title">Click or drag a file to upload</p>
            <p className="prompt-subtitle">Supports PDF, DOCX, TXT, PPT (Max 50MB)</p>
          </div>
        )}
      </div>

      <style>{`
        .file-input-container {
          padding: 8px;
          margin-bottom: 64px;
          width: 100%;
          max-width: 800px;
          border-radius: 24px;
          background: #FFFFFF;
          box-shadow: 0 20px 40px -12px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(6, 182, 212, 0.1);
        }

        .upload-zone {
          border: 2px dashed rgba(6, 182, 212, 0.3);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(6, 182, 212, 0.02);
          min-height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-zone:hover:not(.has-file) {
          background: rgba(6, 182, 212, 0.05);
          border-color: rgba(6, 182, 212, 0.5);
        }

        .upload-zone.dragging {
          background: rgba(6, 182, 212, 0.1);
          border-color: rgba(6, 182, 212, 0.8);
          transform: scale(1.02);
        }

        .upload-zone.has-file {
          cursor: default;
          border-style: solid;
          border-color: rgba(6, 182, 212, 0.2);
          background: #fff;
          padding: 16px;
        }

        .upload-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .prompt-title {
          margin: 0;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 16px;
        }

        .prompt-subtitle {
          margin: 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .file-info {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 16px;
        }

        .file-icon {
          flex-shrink: 0;
        }

        .file-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          overflow: hidden;
        }

        .file-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        .file-size {
          color: var(--text-muted);
          font-size: 13px;
        }

        .file-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .clear-btn, .analyze-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }

        .clear-btn {
          padding: 0 16px;
          background: rgba(100, 116, 139, 0.05);
          border: 1px solid rgba(100, 116, 139, 0.2);
          color: #64748b;
        }
        
        .clear-btn:hover:not(:disabled) {
          background: rgba(100, 116, 139, 0.1);
          color: #475569;
          transform: translateY(-1px);
        }

        .analyze-btn {
          padding: 0 24px;
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25), inset 0 1px 1px rgba(255,255,255,0.2);
          letter-spacing: 0.3px;
        }

        .analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4), inset 0 1px 1px rgba(255,255,255,0.3);
          background: linear-gradient(135deg, #0891b2, #0e7490);
        }

        .analyze-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
        }

        .analyze-btn:disabled, .clear-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }
        
        .analyze-btn:disabled {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          box-shadow: none;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .file-info {
            flex-direction: column;
            text-align: center;
          }
          .file-details {
            align-items: center;
            text-align: center;
          }
          .file-actions {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
