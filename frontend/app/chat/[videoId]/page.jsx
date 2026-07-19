'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/authContext';
import api from '../../../lib/api';
import Navbar from '../../../components/ui/Navbar';
import ChatWindow from '../../../components/chat/ChatWindow';
import ChatInput from '../../../components/chat/ChatInput';
import VideoCard from '../../../components/video/VideoCard';
import DownloadModal from '../../../components/video/DownloadModal';
import toast from 'react-hot-toast';
import { LayoutDashboard, LogOut, ChevronUp, ChevronDown, Download, Trash2 } from 'lucide-react';
import ChatSkeleton from '../../../components/ui/ChatSkeleton';

export default function ChatPage() {
  const { videoId } = useParams();
  const { user, loading: authLoading, logout, refreshTokens } = useAuth();
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [contextType, setContextType] = useState('video');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showVideoInfo, setShowVideoInfo] = useState(true);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Cleanup AbortController on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [infoRes, historyRes] = await Promise.all([
          api.get(`/chat/info/${videoId}`),
          api.get(`/chat/history/${videoId}`),
        ]);
        setVideo(infoRes.data.video);
        setContextType(infoRes.data.type || 'video');
        setMessages(historyRes.data.messages || []);
      } catch (err) {
        toast.error('Failed to load context or chat history');
      } finally { setLoading(false); }
    })();
  }, [videoId, user]);

  const sendMessage = async (text, language = 'English') => {
    if (!text.trim() || sending) return;
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    // Add placeholder for assistant
    const placeholderId = Date.now();
    setMessages(prev => [...prev, {
      role: 'assistant', content: '', timestamp: new Date(), id: placeholderId, streaming: true
    }]);

    try {
      let token = window.__accessToken;
      abortRef.current = new AbortController();
      let res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include',
          body: JSON.stringify({ videoId, message: text, language }),
          signal: abortRef.current.signal,
        }
      );

      if (res.status === 401) {
        token = await refreshTokens();
        if (token) {
          res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/chat/message`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              credentials: 'include',
              body: JSON.stringify({ videoId, message: text, language }),
              signal: abortRef.current.signal,
            }
          );
        }
      }

      if (!res.ok) {
        let errMsg = 'Failed to get response';
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;
          
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {}
          
          if (parsed) {
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => prev.map(m =>
                m.id === placeholderId ? { ...m, content: fullText } : m
              ));
            }
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === placeholderId ? { ...m, streaming: false, id: undefined } : m
      ));
      
      // Refresh history to get database _id for newly created messages
      try {
        const historyRes = await api.get(`/chat/history/${videoId}`);
        if (historyRes.data.messages) setMessages(historyRes.data.messages);
      } catch (e) {}
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error(err.message || 'Failed to get response');
        setMessages(prev => prev.filter(m => m.id !== placeholderId));
      }
    } finally { setSending(false); }
  };


  const handleFeedback = async (messageId, feedback) => {
    try {
      await api.post('/chat/feedback', { videoId, messageId, feedback });
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, feedback } : m
      ));
      toast.success('Feedback recorded!');
    } catch (err) {
      toast.error('Failed to submit feedback');
    }
  };

  const handleRegenerate = async () => {
    if (sending) return;
    setSending(true);

    // Remove the last assistant message
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
        newMessages.pop();
      }
      return newMessages;
    });

    const placeholderId = Date.now();
    setMessages(prev => [...prev, {
      role: 'assistant', content: '', timestamp: new Date(), id: placeholderId, streaming: true
    }]);

    try {
      let token = window.__accessToken;
      abortRef.current = new AbortController();
      // Using fetch instead of api to handle stream
      let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ videoId, language: 'English' }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('Failed to regenerate response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;
          let parsed;
          try { parsed = JSON.parse(data); } catch (e) {}
          if (parsed && parsed.text) {
            fullText += parsed.text;
            setMessages(prev => prev.map(m =>
              m.id === placeholderId ? { ...m, content: fullText } : m
            ));
          }
        }
      }
      setMessages(prev => prev.map(m =>
        m.id === placeholderId ? { ...m, streaming: false, id: undefined } : m
      ));

      // Refresh history to get database _id for newly created messages
      try {
        const historyRes = await api.get(`/chat/history/${videoId}`);
        if (historyRes.data.messages) setMessages(historyRes.data.messages);
      } catch (e) {}
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error(err.message || 'Failed to regenerate response');
        setMessages(prev => prev.filter(m => m.id !== placeholderId));
      }
    } finally { setSending(false); }
  };

  const clearHistory = async () => {
    await api.delete(`/chat/history/${videoId}`);
    setMessages([]);
    toast.success('Chat cleared');
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };



  if (authLoading || loading) return <ChatSkeleton />;
  if (!user) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="chat-layout">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          {/* Brand & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }} title="Go to Dashboard">
              <span className="gradient-text" style={{ fontSize: '24px', fontWeight: 800 }}>FIY-Talks</span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 0 }}>Personal AI Assistant</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleLogout} title="Sign Out" style={{
                padding: '8px', background: 'transparent', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer'
              }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {video && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: showVideoInfo ? '16px' : '0' }}>
                <div 
                  onClick={() => setShowVideoInfo(!showVideoInfo)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    {contextType === 'doc' ? 'Current Document' : contextType === 'insta' ? 'Current Post' : 'Current Video'}
                  </h3>
                  {showVideoInfo ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  {contextType !== 'doc' && (
                    <button onClick={() => setShowDownload(true)} title="Download Media" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                      <Download size={14} />
                      <span className="desktop-text" style={{ whiteSpace: 'nowrap' }}>Download</span>
                    </button>
                  )}
                  <button onClick={clearHistory} title="Clear Chat" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                    <Trash2 size={14} />
                    <span className="desktop-text" style={{ whiteSpace: 'nowrap' }}>Clear Chat</span>
                  </button>
                </div>
              </div>

              {showVideoInfo && <VideoCard video={video} compact />}
            </div>
          )}
        </aside>

        {/* Chat */}
        <main className="chat-main">
          <ChatWindow 
            messages={messages} 
            contextType={contextType}
            onFeedback={handleFeedback}
            onRegenerate={handleRegenerate} 
          />
          <ChatInput onSend={sendMessage} disabled={sending} />
        </main>
      </div>

      {showDownload && (
        <DownloadModal video={video} onClose={() => setShowDownload(false)} />
      )}
    </div>
  );
}
