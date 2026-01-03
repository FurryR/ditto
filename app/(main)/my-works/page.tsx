'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, Edit2, Trash2, Heart, MessageCircle } from 'lucide-react';

interface Work {
  id: string;
  userId: string;
  templateId: string | null;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  title: string | null;
  promptUsed: string | null;
  additionalPrompt: string | null;
  isPublished: boolean;
  createdAt: string;
}

export default function MyWorksPage() {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('profile');
  const { user } = useUserStore();

  // Use SWR to fetch works
  const { data: works = [], error, mutate } = useSWR<Work[]>(user ? '/api/works' : null, fetcher);

  const loading = !works && !error;

  useEffect(() => {
    if (error) {
      console.error('Error fetching works:', error);
      toast.error(tProfile('works.loadError') || 'Failed to load works');
    }
  }, [error, tProfile]);

  const handleDelete = async (workId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm(tProfile('works.deleteConfirm') || 'Are you sure you want to delete this work?')) {
      return;
    }

    try {
      const response = await fetch(`/api/works/${workId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete work');

      mutate(); // Revalidate works
      toast.success(tProfile('works.deleteSuccess') || 'Work deleted successfully');
    } catch (error) {
      console.error('Error deleting work:', error);
      toast.error(tProfile('works.deleteError') || 'Failed to delete work');
    }
  };

  const handleView = (workId: string) => {
    router.push(`/works/${workId}`);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">
          {tProfile('works.pleaseSignIn') || 'Please sign in to view your works'}
        </p>
        <Link href="/signin" className="text-primary mt-4 inline-block hover:underline">
          {tProfile('goToSignIn') || 'Sign In'}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">{tProfile('works.title') || 'My Works'}</h1>
        <div className="text-muted-foreground text-sm">
          {works.length}{' '}
          {works.length === 1 ? tCommon('work') || 'work' : tCommon('works') || 'works'}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4">
                <Skeleton className="mb-2 h-6 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : works.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center">
          <p className="mb-4">{tProfile('works.noWorks') || 'No works yet'}</p>
          <Button asChild>
            <Link href="/templates">
              {tProfile('works.createFirst') || 'Create your first work'}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
          {works.map((work) => (
            <Card
              key={work.id}
              className="group mb-6 cursor-pointer break-inside-avoid overflow-hidden transition-shadow hover:shadow-lg"
              onClick={() => handleView(work.id)}
            >
              <div className="bg-muted relative w-full overflow-hidden">
                <Image
                  src={work.imageUrl}
                  alt={work.title || tCommon('work') || 'Work'}
                  width={400}
                  height={400}
                  className="h-auto w-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(work.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/works/${work.id}`);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => handleDelete(work.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="mb-2 truncate font-semibold">
                  {work.title || tProfile('works.untitled') || 'Untitled Work'}
                </h3>
                <div className="text-muted-foreground mb-2 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {work.likesCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {work.commentsCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {work.viewsCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={work.isPublished ? 'default' : 'secondary'}>
                    {work.isPublished
                      ? tProfile('works.published') || 'Published'
                      : tProfile('works.draft') || 'Draft'}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {new Date(work.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
