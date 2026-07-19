'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
      <nav className="navbar-container" style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        padding: '16px 32px', width: '100%', maxWidth: '1200px', margin: '0 auto'
      }}>
        <Link href="/dashboard" className="navbar-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <span className="gradient-text" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
            FIY-Talks
          </span>
        </Link>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="navbar-username" style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
              {user.name}
            </span>
            <button onClick={handleLogout} className="signout-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', background: 'transparent', border: 'none',
                borderRadius: '100px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
                fontWeight: 500, transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
              <span className="signout-text">Sign Out</span>
              <LogOut size={16} className="signout-icon" />
            </button>
          </div>
        )}
      </nav>
      {/* CSS for responsive elements */}
      <style>{`
        .navbar-container { justify-content: space-between !important; }
        .navbar-logo { position: static; transform: none; }
        .navbar-username { display: none; }
        .signout-icon { display: none; }
        @media (max-width: 600px) {
          .navbar-container { padding: 12px 16px !important; justify-content: flex-end !important; }
          .navbar-logo { position: absolute !important; left: 50% !important; transform: translateX(-50%) !important; }
          .signout-text { display: none; }
          .signout-icon { display: block; }
          .signout-btn { padding: 8px !important; }
        }
        @media (min-width: 600px) { 
          .navbar-username { display: inline !important; } 
        }
      `}</style>
    </header>
  );
}
