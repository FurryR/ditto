'use client';

import { use, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileView, type ProfileRow } from '@/components/ProfileView';

export default function PublicProfilePage({ params }: { params: Promise<{ userName: string }> }) {
  const resolvedParams = use(params);
  const t = useTranslations('profile');

  // Use SWR to fetch profile data
  const { data, error } = useSWR(`/api/profile/${resolvedParams.userName}`, fetcher);

  const loading = !data && !error;
  const profile: ProfileRow | null = data?.profile || null;
  const templates = data?.templates || [];
  const works = data?.works || [];

  useEffect(() => {
    if (error) {
      console.error('Failed to load profile:', error);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Card className="overflow-hidden p-0">
            <Skeleton className="h-40 w-full" />
            <div className="px-6 pb-4">
              <div className="flex items-start gap-6">
                <Skeleton className="-mt-10 h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-3 pt-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <div className="space-y-10">
            <section>
              <Skeleton className="mb-6 h-8 w-32" />
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mb-4 break-inside-avoid">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </section>
            <section>
              <Skeleton className="mb-6 h-8 w-32" />
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mb-4 break-inside-avoid">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">{t('userNotFound')}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileView profile={profile} templates={templates} works={works} editable={false} />
    </div>
  );
}
