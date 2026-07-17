'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Navbar from '../../components/ui/Navbar';
import VideoCard from '../../components/video/VideoCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();

  const urlInputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.get('/video/history').then(({ data }) => {
        setHistory(data.videos || []);
      }).catch(() => {}).finally(() => setLoadingHistory(false));
    }
  }, [user]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input already
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        // Allow escaping out of inputs
        if (e.key === 'Escape') document.activeElement.blur();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/') {
        e.preventDefault();
        urlInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleProcess = async () => {
    if (!url.trim()) return;
    setProcessing(true);
    try {
      const { data } = await api.post('/video/process', { url });
      toast.success(data.cached ? 'Video loaded from cache!' : 'Video processed!');
      router.push(`/chat/${data.video.videoId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process video');
    } finally { setProcessing(false); }
  };

  const filteredHistory = history.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <div className="fade-in-up">Authenticating...</div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="app-container">
      <div className="ambient-bg">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
      </div>
      
      <Navbar />
      
      <style>{`
        .analyze-text { display: inline; }
        .analyze-btn { padding: 0 24px; }
        @media (max-width: 600px) {
          .analyze-text { display: none; }
          .analyze-btn { padding: 0 16px !important; gap: 0 !important; }
        }
      `}</style>
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '8px 24px 32px 24px', width: '100%', flex: 1 }}>
        {/* Hero */}
        <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '100px', color: 'var(--accent-purple)', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
            <Sparkles size={14} /> Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '12px', marginTop: 0, whiteSpace: 'nowrap' }}>
            Meet <span className="gradient-text">TubeTalks</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5, fontWeight: 400 }}>
            Your personal AI assistant for YouTube videos. Paste a URL and let the magic happen.
            <br/><span style={{fontSize: '12px', opacity: 0.7}}>Shortcuts: press <code>/</code> for URL, <code>Ctrl+K</code> for search</span>
          </p>
        </div>

        {/* URL Input */}
        <div className="glass fade-in-up" style={{ padding: '6px', marginBottom: '48px', maxWidth: '640px', margin: '0 auto 48px auto', borderRadius: '100px', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', gap: '6px', position: 'relative' }}>
            <input
              id="video-url-input"
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleProcess()}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{
                flex: 1, padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '15px', outline: 'none',
                minWidth: 0,
                textOverflow: 'ellipsis'
              }}
            />
            <button id="analyze-btn" onClick={handleProcess} className="btn-primary analyze-btn" disabled={processing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '100px', margin: '3px', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {processing ? '...' : (
                <><span className="analyze-text">Analyze</span> <Sparkles size={16} /></>
              )}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Recent Videos
            </h2>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 16px', borderRadius: '100px', border: '1px solid var(--glass-border)',
                background: 'var(--bg-secondary)', fontSize: '13px', color: 'var(--text-primary)',
                outline: 'none', minWidth: '200px', flex: '1 1 200px'
              }}
            />
          </div>
          <div style={{ height: '1px', width: '100%', background: 'var(--glass-border)', marginBottom: '20px' }}></div>
          
          {loadingHistory ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[1,2,3].map(i => <LoadingSkeleton key={i} height="100px" />)}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
              {searchQuery ? 'No videos match your search.' : 'No videos yet. Paste a YouTube URL above to get started.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredHistory.map(video => (
                <VideoCard key={video.videoId} video={video}
                  onClick={() => router.push(`/chat/${video.videoId}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
