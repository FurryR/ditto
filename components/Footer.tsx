'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function Footer() {
  const t = useTranslations('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🎭</div>
              <span className="text-lg font-bold">{t('appName')}</span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{t('appDescription')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {t('gallery')}
                </Link>
              </li>
              <li>
                <Link
                  href="/upload"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {t('upload')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Community</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="https://github.com"
                  className="text-muted-foreground hover:text-foreground text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-muted-foreground text-sm">
              © {currentYear} {t('appName')}. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm">
              <Link href="/eula" className="text-muted-foreground hover:text-foreground">
                {t('eula')}
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                {t('privacy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
