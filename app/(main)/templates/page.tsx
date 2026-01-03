'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { Template } from '@/types';

type ExtendedTemplate = Template & {
  viewsCount?: number;
  likesCount?: number;
  usesCount?: number;
  averageRating?: number;
  reviewsCount?: number;
};

export default function TemplatesPage() {
  const t = useTranslations('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Use SWR to fetch templates
  const { data, error } = useSWR('/api/templates', fetcher);

  const loading = !data && !error;
  const templates: ExtendedTemplate[] = data
    ? data.map((tpl: any) => ({
        ...tpl,
        viewsCount: tpl.stats?.viewsCount ?? 0,
        likesCount: tpl.stats?.likesCount ?? 0,
        usesCount: tpl.stats?.usesCount ?? 0,
        averageRating: tpl.stats?.averageRating ?? 0,
        reviewsCount: tpl.stats?.reviewsCount ?? 0,
      }))
    : [];

  useEffect(() => {
    if (error) {
      console.error('Error fetching templates:', error);
      toast.error(t('loadError'));
    }
  }, [error, t]);

  const categories = [
    { id: 'all', label: t('filterAll') },
    { id: 'meme', label: t('filterMeme') },
    { id: 'anime', label: t('filterAnime') },
    { id: 'comic', label: t('filterComic') },
    { id: 'album-art', label: t('filterAlbumArt') },
  ];

  const filteredTemplates = templates.filter((template) => {
    // Filter out unpublished templates (they should not appear in public search)
    if (!template.isPublished) {
      return false;
    }
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center">{t('noResults')}</div>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
          {filteredTemplates.map((template) => (
            <Link key={template.id} href={`/template/${template.id}`}>
              <Card className="group mb-6 break-inside-avoid overflow-hidden transition-all hover:shadow-lg">
                <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={template.coverImageUrl || template.baseImageUrl}
                    alt={template.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-2 line-clamp-1 font-semibold">{template.name}</h3>
                  <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-muted-foreground mt-3 flex items-center gap-4 text-xs">
                    {template.averageRating && template.averageRating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{template.averageRating.toFixed(1)}</span>
                        <span>({template.reviewsCount || 0})</span>
                      </div>
                    ) : null}
                    <span>❤️ {template.likesCount || 0}</span>
                    <span>👁️ {template.viewsCount || 0}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
