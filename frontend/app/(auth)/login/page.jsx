'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/authContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const submittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      if (err.response?.status !== 429) {
        toast.error(err.response?.data?.error || 'Login failed');
      }
    } finally { 
      setLoading(false); 
      submittingRef.current = false;
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div className="glass fade-in-up" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
            <span className="gradient-text">FIY-Talks</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '14px', outline: 'none',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '14px', outline: 'none',
              }}
              placeholder="••••••••"
            />
          </div>

          <button id="login-submit" type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', fontSize: '15px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          No account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
