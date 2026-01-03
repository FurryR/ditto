'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trash2, Edit, Eye, EyeOff } from 'lucide-react';

export default function ProfileTemplatesPage() {
  const t = useTranslations('profile');
  const { user } = useUserStore();

  // Use SWR to fetch templates
  const {
    data: templates = [],
    error,
    mutate,
  } = useSWR(user ? `/api/templates?authorId=${user.id}` : null, fetcher);

  const loading = !templates && !error;

  useEffect(() => {
    if (error) {
      console.error('Error fetching templates:', error);
      toast.error(t('templates.loadError'));
    }
  }, [error, t]);

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update template');

      toast.success(currentStatus ? t('templates.unpublished') : t('templates.published'));
      mutate(); // Revalidate templates
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error(t('templates.operationFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('templates.confirmDelete'))) return;
    try {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete template');

      toast.success(t('templates.deleted'));
      mutate(); // Revalidate templates
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(t('templates.deleteError'));
    }
  };

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
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">{t('templates.title')}</h1>
        <Link href="/studio">
          <Button>{t('templates.createButton')}</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-muted-foreground mb-4">{t('templates.noTemplates')}</p>
          <Link href="/studio">
            <Button>{t('templates.createFirst')}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template: any) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="bg-muted relative aspect-[4/3] overflow-hidden">
                <Image
                  src={template.coverImageUrl || template.baseImageUrl}
                  alt={template.name}
                  fill
                  className="object-cover"
                />
                {template.isPublished && (
                  <Badge className="absolute top-2 right-2">{t('templates.publishedBadge')}</Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="mb-2 line-clamp-1 font-semibold">{template.name}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                  {template.description}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/studio?templateId=${template.id}`}>
                      <Edit className="mr-1 h-4 w-4" />
                      {t('templates.editAction')}
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePublish(template.id, template.isPublished)}
                  >
                    {template.isPublished ? (
                      <>
                        <EyeOff className="mr-1 h-4 w-4" />
                        {t('templates.unpublishAction')}
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-4 w-4" />
                        {t('templates.publishAction')}
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
