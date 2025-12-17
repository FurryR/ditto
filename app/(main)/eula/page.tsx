'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EulaPage() {
  const t = useTranslations('eula');
  const tCommon = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('back')}
        </Link>
      </Button>

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

        <Card>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">{t('section1Title')}</h2>
              <p className="text-muted-foreground">{t('section1Content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">{t('section2Title')}</h2>
              <p className="text-muted-foreground">{t('section2Content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">{t('section3Title')}</h2>
              <p className="text-muted-foreground">{t('section3Content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">{t('section4Title')}</h2>
              <p className="text-muted-foreground">{t('section4Content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">{t('section5Title')}</h2>
              <p className="text-muted-foreground">{t('section5Content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">{t('section6Title')}</h2>
              <p className="text-muted-foreground">{t('section6Content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">{t('section7Title')}</h2>
              <p className="text-muted-foreground">{t('section7Content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">{t('section8Title')}</h2>
              <p className="text-muted-foreground">{t('section8Content')}</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
