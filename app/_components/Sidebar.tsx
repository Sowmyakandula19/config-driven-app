'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appConfig } from '@/lib/config';
import { useLocale } from './Providers';

export function Sidebar() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useLocale();

  const handleExport = async () => {
    const res = await fetch('/api/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appforge-export.zip';
    a.click();
  };

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ 
          fontFamily: 'Syne, sans-serif', 
          fontWeight: 800, 
          fontSize: '1.25rem',
          color: 'var(--accent)',
          letterSpacing: '-0.02em'
        }}>
          ⬡ AppForge
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text2)', marginTop: '0.25rem' }}>
          {appConfig.app.name}
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {appConfig.pages.map((page) => {
          const active = pathname === page.route;
          return (
            <Link
              key={page.route}
              href={page.route}
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                color: active ? 'var(--accent)' : 'var(--text2)',
                background: active ? 'rgba(124,106,255,0.12)' : 'transparent',
                border: active ? '1px solid rgba(124,106,255,0.3)' : '1px solid transparent',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
            >
              {page.type === 'dashboard' ? '⬡' : page.type === 'table' ? '▤' : '◈'}
              {page.title}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Language switcher */}
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
        >
          <option value="en">🇬🇧 English</option>
          <option value="es">🇪🇸 Español</option>
        </select>

        <button
          onClick={handleExport}
          className="btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.5rem' }}
        >
          ↓ {t('nav.export')}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: '/auth' })}
          className="btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.5rem', color: 'var(--error)', borderColor: 'var(--error)' }}
        >
          ⏻ {t('nav.signout')}
        </button>
      </div>
    </aside>
  );
}
