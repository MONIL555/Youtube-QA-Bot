'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/authContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div className="glass fade-in-up" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            TubeTalks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Create Account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              maxLength={50}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '14px', outline: 'none',
              }}
              placeholder="John Doe"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
              Email
            </label>
            <input
              id="register-email"
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

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
              Password
            </label>
            <input
              id="register-password"
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              minLength={8}
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

          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '24px' }}>
            Min 8 characters, 1 uppercase, 1 number, 1 special character (@$!%*?&)
          </p>

          <button id="register-submit" type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', fontSize: '15px' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
