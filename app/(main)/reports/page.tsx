'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const { user } = useUserStore();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t('pleaseSignIn')}</p>
        <Link href="/signin" className="text-primary mt-4 inline-block hover:underline">
          {t('goToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">{t('title')}</h1>
      <Card className="p-8">
        <p className="text-muted-foreground text-center">{t('noReports')}</p>
      </Card>
    </div>
  );
}
