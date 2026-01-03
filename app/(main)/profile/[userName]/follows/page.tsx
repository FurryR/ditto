'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useUserStore } from '@/store/userStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

type UserProfile = {
  id: string;
  githubUsername?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  bio?: string | null;
  followingCount?: number;
  followersCount?: number;
};

export default function FollowsPage({ params }: { params: Promise<{ userName: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'following';
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { user } = useUserStore();

  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [processingFollow, setProcessingFollow] = useState<Record<string, boolean>>({});

  // First, get the profile ID from the username
  const { data: profileData } = useSWR(`/api/profile/${resolvedParams.userName}`, fetcher);

  const profileId = profileData?.profile?.id;

  // Then fetch the appropriate list
  const endpoint = profileId
    ? tab === 'following'
      ? `/api/users/${profileId}/following`
      : `/api/users/${profileId}/followers`
    : null;

  const { data: usersData, error, mutate } = useSWR(endpoint, fetcher);

  const loading = !usersData && !error && !profileData;
  const users: UserProfile[] = usersData?.users || [];

  // Check follow status for each user
  useEffect(() => {
    if (!user?.id || !users.length) return;

    const checkFollowStates = async () => {
      const states: Record<string, boolean> = {};
      await Promise.all(
        users.map(async (u: UserProfile) => {
          if (u.id === user.id) {
            states[u.id] = false;
            return;
          }

          try {
            const followResponse = await fetch(`/api/users/${u.id}/follow`);
            if (followResponse.ok) {
              const followData = await followResponse.json();
              states[u.id] = followData.isFollowing;
            }
          } catch (error) {
            console.error(`Failed to check follow status for user ${u.id}:`, error);
          }
        })
      );
      setFollowStates(states);
    };

    checkFollowStates();
  }, [user?.id, users]);

  useEffect(() => {
    if (error || (!profileData && !loading)) {
      toast.error(t('userNotFound'));
    }
  }, [error, profileData, loading, t]);

  const handleFollow = async (targetUserId: string) => {
    if (!user?.id) {
      toast.error(t('pleaseSignIn'));
      return;
    }

    setProcessingFollow((prev) => ({ ...prev, [targetUserId]: true }));

    try {
      const isFollowing = followStates[targetUserId];
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${targetUserId}/follow`, { method });

      if (!response.ok) {
        throw new Error('Follow operation failed');
      }

      setFollowStates((prev) => ({
        ...prev,
        [targetUserId]: !isFollowing,
      }));

      toast.success(isFollowing ? t('unfollowed') : t('followed'));
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
      toast.error(t('followError'));
    } finally {
      setProcessingFollow((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const renderUserCard = (userProfile: UserProfile) => {
    const displayName = userProfile.displayName || userProfile.githubUsername || tCommon('user');
    const isCurrentUser = user?.id === userProfile.id;
    const isFollowing = followStates[userProfile.id];
    const isProcessing = processingFollow[userProfile.id];

    return (
      <Card key={userProfile.id} className="p-4">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${userProfile.githubUsername}`} className="shrink-0">
            <div className="bg-muted relative h-12 w-12 overflow-hidden rounded-full">
              <Image
                src={userProfile.avatarUrl || '/default-avatar.jpg'}
                alt={displayName}
                fill
                className="object-cover"
              />
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            <Link href={`/profile/${userProfile.githubUsername}`} className="block">
              <div className="truncate text-base font-semibold hover:underline">{displayName}</div>
              {userProfile.githubUsername && (
                <div className="text-muted-foreground truncate text-sm">
                  @{userProfile.githubUsername}
                </div>
              )}
            </Link>
            {userProfile.bio && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{userProfile.bio}</p>
            )}
            <div className="text-muted-foreground mt-2 flex gap-3 text-sm">
              <span>
                <span className="text-foreground font-semibold">
                  {userProfile.followingCount || 0}
                </span>{' '}
                {t('following')}
              </span>
              <span>
                <span className="text-foreground font-semibold">
                  {userProfile.followersCount || 0}
                </span>{' '}
                {t('followers')}
              </span>
            </div>
          </div>

          {!isCurrentUser && user?.id && (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={() => handleFollow(userProfile.id)}
              disabled={isProcessing}
            >
              {isFollowing ? t('unfollowUser') : t('followUser')}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href={`/profile/${resolvedParams.userName}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon('back')}
            </Link>
          </Button>

          <h1 className="mb-4 text-2xl font-bold">{t('followsTitle')}</h1>

          <div className="flex gap-2 border-b">
            <Link
              href={`/profile/${resolvedParams.userName}/follows?tab=following`}
              className={
                'border-b-2 px-4 py-2 font-medium transition-colors ' +
                (tab === 'following'
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent')
              }
            >
              {t('followingTab')}
            </Link>
            <Link
              href={`/profile/${resolvedParams.userName}/follows?tab=followers`}
              className={
                'border-b-2 px-4 py-2 font-medium transition-colors ' +
                (tab === 'followers'
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent')
              }
            >
              {t('followersTab')}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {tab === 'following' ? t('noFollowing') : t('noFollowers')}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">{users.map(renderUserCard)}</div>
        )}
      </div>
    </div>
  );
}
