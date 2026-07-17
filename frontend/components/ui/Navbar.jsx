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
    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
      <nav className="glass" style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '8px 12px 8px 16px', borderRadius: '100px', width: '100%', maxWidth: '1000px',
        background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.6)'
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
          <span className="gradient-text" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
            TubeTalks
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
        .navbar-username { display: none; }
        .signout-icon { display: none; }
        @media (max-width: 600px) {
          .signout-text { display: none; }
          .signout-icon { display: block; }
          .signout-btn { padding: 8px !important; }
        }
        @media (min-width: 600px) { 
          .navbar-username { display: inline !important; } 
        }
      `}</style>
    </div>
  );
}
