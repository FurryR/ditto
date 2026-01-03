'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileEditDialog, type EditableProfile } from '@/components/ProfileEditDialog';
import { ProfileView, type ProfileRow } from '@/components/ProfileView';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { user } = useUserStore();

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Use SWR to fetch profile data
  const { data, error, mutate } = useSWR(user?.id ? '/api/profile' : null, fetcher);

  const loading = !data && !error;
  const profile: ProfileRow | null =
    data?.profile ||
    (user
      ? {
          id: user.id,
          githubUsername: user.githubUsername || null,
          avatarUrl: user.avatar || null,
          displayName: user.name || null,
          bio: user.bio || null,
          socialLinks: (user.socialLinks || {}) as any,
        }
      : null);
  const templates = data?.templates || [];
  const works = data?.works || [];

  useEffect(() => {
    if (error) {
      console.error('Failed to load profile:', error);
      toast.error(t('loadProfileError'));
    }
  }, [error, t]);

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

  const handleSaveProfile = async (next: EditableProfile) => {
    if (!profile) return;
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: next.displayName || null,
          bio: next.bio || null,
          socialLinks: next.socialLinks || {},
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();

      toast.success(t('savedToast'));
      setEditOpen(false);
      mutate(); // Revalidate profile data
    } catch (e) {
      toast.error(t('saveProfileError'));
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!user?.id) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/banner', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const social = (profile?.socialLinks || {}) as Record<string, any>;
      social.banner = data.url;

      toast.success(t('bannerUploaded'));
      mutate(); // Revalidate profile data
    } catch (e) {
      toast.error(t('uploadFailed'));
    }
  };

  const handleUpdateProfile = async (updates: Partial<ProfileRow>) => {
    if (!user?.id || !profile) return;

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();

      toast.success(t('savedToast'));
      mutate(); // Revalidate profile data
    } catch (e) {
      toast.error(t('saveProfileError'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading || !profile ? (
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="overflow-hidden rounded-xl border">
            <Skeleton className="h-44 w-full" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : (
        <>
          <ProfileView
            profile={profile}
            templates={templates}
            works={works}
            editable
            showSettings
            onEdit={() => setEditOpen(true)}
            onBannerUpload={handleBannerUpload}
            onUpdateProfile={handleUpdateProfile}
          />

          <ProfileEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            saving={saving}
            initial={{
              displayName: profile.displayName,
              bio: profile.bio,
              socialLinks: (profile.socialLinks || {}) as any,
            }}
            onSave={handleSaveProfile}
          />
        </>
      )}
    </div>
  );
}
