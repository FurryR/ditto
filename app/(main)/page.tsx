'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, Users } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="from-primary/10 to-background relative overflow-hidden bg-gradient-to-b px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">{t('subtitle')}</p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" asChild>
              <Link href="/templates">{t('exploreTemplates')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/studio">{t('createTemplate')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('featuresTitle')}</h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
            <Card className="flex flex-col items-center p-8 text-center">
              <div className="bg-primary/10 mb-4 rounded-full p-3">
                <Sparkles className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{t('feature1Title')}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t('feature1Description')}</p>
            </Card>

            <Card className="flex flex-col items-center p-8 text-center">
              <div className="bg-primary/10 mb-4 rounded-full p-3">
                <Zap className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{t('feature2Title')}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t('feature2Description')}</p>
            </Card>

            <Card className="flex flex-col items-center p-8 text-center">
              <div className="bg-primary/10 mb-4 rounded-full p-3">
                <Users className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{t('feature3Title')}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t('feature3Description')}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('ctaTitle')}</h2>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-8">
            {t('ctaDescription')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" asChild>
              <Link href="/signin">{tCommon('getStarted')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
