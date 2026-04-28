import type { Metadata } from 'next';
import { Providers } from '@/app/_components/Providers';
import { appConfig } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: appConfig.app.name,
  description: `Powered by AppForge`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={appConfig.app.locale} className={appConfig.app.theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
