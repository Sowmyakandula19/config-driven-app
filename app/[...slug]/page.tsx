import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPage } from '@/lib/config';
import { getRenderer } from '@/components/registry';
import { Sidebar } from '@/app/_components/Sidebar';
import { ToastProvider } from '@/app/_components/Toast';

interface Props {
  params: { slug: string[] };
}

export default async function DynamicPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth');

  const route = '/' + params.slug.join('/');
  const page = getPage(route);

  if (!page) {
    return (
      <AppShell>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', gap: '1rem',
        }}>
          <div style={{ fontSize: '3rem', opacity: 0.3 }}>404</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text2)' }}>
            Page not found in config
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>
            Add a page with route <code style={{ color: 'var(--accent)' }}>"{route}"</code> to <code>app.config.json</code>
          </div>
        </div>
      </AppShell>
    );
  }

  const Renderer = getRenderer(page.type);

  return (
    <AppShell>
      <Renderer page={page} />
    </AppShell>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: '220px', padding: '2.5rem', maxWidth: '1200px' }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
