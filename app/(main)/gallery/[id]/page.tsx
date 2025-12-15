'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function GalleryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    router.replace(`/template/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">{t('redirecting')}</p>
    </div>
  );
}
