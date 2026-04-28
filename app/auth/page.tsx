'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { appConfig } from '@/lib/config';
import { useLocale } from '@/app/_components/Providers';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
    }

    const result = await signIn('credentials', {
      email, password, redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push(appConfig.pages[0]?.route || '/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(124,106,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,106,124,0.06) 0%, transparent 60%)',
    }}>
      {/* Language switcher top right */}
      <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem' }}>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
        >
          <option value="en">🇬🇧 EN</option>
          <option value="es">🇪🇸 ES</option>
        </select>
      </div>

      <div style={{ width: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '2rem', color: 'var(--accent)' }}>
            ⬡ AppForge
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {appConfig.app.name}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: '16px', padding: '2rem' }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: '8px', padding: '4px', marginBottom: '1.5rem' }}>
            {['signin', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as any)}
                style={{
                  flex: 1, padding: '0.5rem',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--text2)',
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'Syne', fontWeight: 600, fontSize: '0.875rem',
                  transition: 'all 0.2s',
                }}
              >
                {m === 'signin' ? t('auth.signin') : t('auth.signup')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <div>
                <label>{t('auth.name')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              </div>
            )}
            <div>
              <label>{t('auth.email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label>{t('auth.password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {error && (
              <div style={{ color: 'var(--error)', fontSize: '0.8rem', padding: '0.6rem 0.875rem', background: 'rgba(248,113,113,0.1)', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)' }}>
                ✕ {error}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            >
              {loading ? '...' : (mode === 'signin' ? t('auth.signin') : t('auth.signup'))}
            </button>

            {/* Google OAuth */}
            {appConfig.auth.methods.includes('google') && (
              <>
                <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '0.8rem' }}>{t('auth.or')}</div>
                <button
                  className="btn-ghost"
                  onClick={() => signIn('google', { callbackUrl: appConfig.pages[0]?.route || '/dashboard' })}
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  🔵 {t('auth.google')}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            {mode === 'signin' ? t('auth.switch.signup') : t('auth.switch.signin')}
          </button>
        </div>
      </div>
    </div>
  );
}
