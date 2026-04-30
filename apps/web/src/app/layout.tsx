import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

import { SwRegister } from '@/components/pwa/sw-register';

import './globals.css';

export const metadata: Metadata = {
  title: 'LETget · Списки и заметки',
  description: 'Лаконично. Понятно. На каждый день.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1410',
};

// Static, build-time string — no user input. Runs before paint to set data-theme
// from localStorage to prevent FOUC when switching between light/dark modes.
const themeInitScript = `(function(){try{var t=localStorage.getItem('letget:theme')||'system';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
