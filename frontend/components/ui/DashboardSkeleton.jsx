'use client';
import LoadingSkeleton from './LoadingSkeleton';
import Navbar from './Navbar';

export default function DashboardSkeleton() {
  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="ambient-bg"></div>
      
      <Navbar />
      
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 64px 24px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <LoadingSkeleton width="180px" height="32px" borderRadius="100px" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <LoadingSkeleton width="400px" height="60px" borderRadius="16px" />
          </div>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <LoadingSkeleton width="100%" height="24px" borderRadius="8px" />
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
              <LoadingSkeleton width="80%" height="24px" borderRadius="8px" />
            </div>
          </div>
        </div>

        <div style={{ padding: '8px', marginBottom: '64px', width: '100%', maxWidth: '800px', borderRadius: '24px', background: '#FFFFFF', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
            <div style={{ flex: 1, padding: '12px' }}>
              <LoadingSkeleton width="100%" height="24px" />
            </div>
            <LoadingSkeleton width="160px" height="48px" borderRadius="16px" />
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <LoadingSkeleton width="140px" height="24px" />
            <LoadingSkeleton width="200px" height="36px" borderRadius="100px" />
          </div>
          <div style={{ height: '1px', width: '100%', background: 'var(--glass-border)', marginBottom: '20px' }}></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <LoadingSkeleton key={i} height="100px" borderRadius="16px" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
