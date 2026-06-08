import './globals.css';
import type { Metadata } from 'next';
import { Manrope, Fraunces } from 'next/font/google';
import { Providers } from './providers';
import { cn } from '@/lib/utils';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BrightArrow',
  description: 'Field operations platform for missions, KPIs, and reports.',
  icons: { icon: '/favicon.svg' },
  appleWebApp: {
    capable: true,
    title: 'BrightArrow',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(manrope.variable, fraunces.variable)}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
