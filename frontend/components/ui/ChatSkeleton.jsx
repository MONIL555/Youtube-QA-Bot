'use client';
import LoadingSkeleton from './LoadingSkeleton';

export default function ChatSkeleton() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="chat-layout">
        {/* Sidebar Skeleton */}
        <aside className="chat-sidebar">
          {/* Brand & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <LoadingSkeleton width="120px" height="28px" borderRadius="8px" />
              <LoadingSkeleton width="80px" height="12px" borderRadius="4px" />
            </div>
            <LoadingSkeleton width="32px" height="32px" borderRadius="8px" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <LoadingSkeleton width="100px" height="16px" borderRadius="4px" />
              <div style={{ display: 'flex', gap: '6px' }}>
                <LoadingSkeleton width="80px" height="26px" borderRadius="4px" />
                <LoadingSkeleton width="80px" height="26px" borderRadius="4px" />
              </div>
            </div>

            {/* Video Card Skeleton */}
            <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <LoadingSkeleton width="120px" height="68px" borderRadius="8px" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <LoadingSkeleton width="100%" height="14px" />
                <LoadingSkeleton width="80%" height="14px" />
                <LoadingSkeleton width="40%" height="12px" />
              </div>
            </div>
          </div>
        </aside>

        {/* Chat Main Skeleton */}
        <main className="chat-main" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
            {/* User message */}
            <div style={{ alignSelf: 'flex-end', width: '60%' }}>
              <LoadingSkeleton width="100%" height="60px" borderRadius="16px 16px 0 16px" />
            </div>
            {/* Assistant message */}
            <div style={{ alignSelf: 'flex-start', width: '80%' }}>
              <LoadingSkeleton width="100%" height="120px" borderRadius="16px 16px 16px 0" />
            </div>
            {/* User message */}
            <div style={{ alignSelf: 'flex-end', width: '40%' }}>
              <LoadingSkeleton width="100%" height="40px" borderRadius="16px 16px 0 16px" />
            </div>
          </div>

          {/* Chat Input Skeleton */}
          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <LoadingSkeleton width="100%" height="56px" borderRadius="100px" />
          </div>
        </main>
      </div>
    </div>
  );
}
