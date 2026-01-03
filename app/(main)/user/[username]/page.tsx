'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { Github, Twitter, Globe } from 'lucide-react';

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const t = useTranslations('user');

  // Use SWR to fetch user profile
  const { data, error } = useSWR(`/api/profile/${params.username}`, fetcher);

  const loading = !data && !error;
  const user = data?.profile;
  const templates = data?.templates || [];

  useEffect(() => {
    if (error) {
      console.error('Error fetching user:', error);
      toast.error(t('userNotFound'));
    }
  }, [error, t]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mx-auto h-32 w-32 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t('userNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 p-8">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
          <div className="relative mb-4 h-32 w-32 shrink-0 overflow-hidden rounded-full sm:mr-6 sm:mb-0">
            <Image
              src={user.avatar || '/placeholder-avatar.png'}
              alt={user.name || params.username}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold">{user.name || params.username}</h1>
            {user.bio && <p className="text-muted-foreground mb-4">{user.bio}</p>}
            {user.socialLinks && (
              <div className="flex gap-2">
                {user.socialLinks.github && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {user.socialLinks.twitter && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {user.socialLinks.website && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <h2 className="mb-4 text-2xl font-bold">{t('templates')}</h2>
      {templates.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">{t('noPublicTemplates')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template: any) => (
            <Link key={template.id} href={`/template/${template.id}`}>
              <Card className="group overflow-hidden transition-all hover:shadow-lg">
                <div className="bg-muted relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={template.coverImageUrl || template.baseImageUrl}
                    alt={template.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 font-semibold">{template.name}</h3>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
