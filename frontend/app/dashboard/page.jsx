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
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="ambient-bg"></div>
      
      <Navbar />
      
      <style>{`
        .analyze-text { display: inline; }
        .analyze-btn { padding: 0 24px; }
        .recent-search-input { min-width: 200px; flex: 0 1 300px; }
        @media (max-width: 600px) {
          .analyze-text { display: none; }
          .analyze-btn { padding: 0 16px !important; gap: 0 !important; }
          .recent-search-input { flex: 1 1 100%; max-width: none; }
          .hero-title { font-size: clamp(32px, 10vw, 48px) !important; white-space: nowrap; }
        }
      `}</style>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 64px 24px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Hero */}
        <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: '56px', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '6px 16px', background: '#FFFFFF', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '100px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Sparkles size={16} color="var(--accent-purple)" /> Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '20px', marginTop: 0, color: 'var(--text-primary)' }}>
            Meet <span className="gradient-text">TubeTalks</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6, fontWeight: 400 }}>
            Your personal AI assistant for YouTube videos. Paste a URL and let the magic happen.
            <br/><span style={{fontSize: '13px', opacity: 0.8, display: 'inline-block', marginTop: '16px'}}>Shortcuts: press <code style={{background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600}}>/</code> for URL, <code style={{background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600}}>Ctrl+K</code> for search</span>
          </p>
        </div>

        {/* URL Input */}
        <div className="fade-in-up" style={{ padding: '8px', marginBottom: '64px', width: '100%', maxWidth: '800px', borderRadius: '24px', background: '#FFFFFF', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            <input
              id="video-url-input"
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleProcess()}
              placeholder="Paste any YouTube URL here..."
              style={{
                flex: 1, padding: '16px 24px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '16px', outline: 'none',
                minWidth: 0,
                textOverflow: 'ellipsis'
              }}
            />
            <button id="analyze-btn" onClick={handleProcess} className="btn-primary analyze-btn" disabled={processing}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '16px', margin: '4px', padding: '0 32px', flexShrink: 0, whiteSpace: 'nowrap', fontSize: '15px', fontWeight: 600, boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
              {processing ? 'Processing...' : (
                <><span className="analyze-text">Analyze Video</span> <Sparkles size={18} /></>
              )}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="fade-in-up" style={{ animationDelay: '0.1s', width: '100%' }}>
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
              className="recent-search-input"
              style={{
                padding: '8px 16px', borderRadius: '100px', border: '1px solid var(--glass-border)',
                background: 'var(--bg-secondary)', fontSize: '13px', color: 'var(--text-primary)',
                outline: 'none'
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
