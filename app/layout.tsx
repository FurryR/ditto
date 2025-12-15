import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './nprogress.css';
import { LocaleProvider } from '@/components/LocaleProvider';
import { AuthInit } from '@/components/AuthInit';
import { ProgressBar } from '@/components/ProgressBar';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ditto',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LocaleProvider>
          <AuthInit />
          <ProgressBar />
          {children}
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
