'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { WorkCommentsComponent } from '@/components/WorkCommentsComponent';
import { ReportDialog } from '@/components/ReportDialog';
import { ArrowLeft, Download, Trash2, Edit2, Check, X, Heart, MessageCircle, Flag, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Work {
  id: string;
  userId: string;
  templateId: string | null;
  imageUrl: string;
  title: string | null;
  description: string | null;
  promptUsed: string | null;
  additionalPrompt: string | null;
  isPublished: boolean;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
}

export default function WorkPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('works');
  const tCommon = useTranslations('common');
  const { user } = useUserStore();
  
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const workId = params.id as string;

  useEffect(() => {
    if (workId) {
      fetchWork();
      if (user) {
        checkLikeStatus();
      }
    }
  }, [workId, user]);

  const fetchWork = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/works/${workId}`);
      if (!response.ok) throw new Error('Failed to fetch work');
      
      const data = await response.json();
      setWork(data);
      setEditTitle(data.title || '');
      setEditDescription(data.description || '');
    } catch (error) {
      console.error('Error fetching work:', error);
      toast.error(t('fetchError') || 'Failed to load work');
      router.push('/my-works');
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/works/${workId}/like`);
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast.error(t('loginToLike') || 'Please sign in to like');
      return;
    }

    try {
      const response = await fetch(`/api/works/${workId}/like`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to toggle like');

      const data = await response.json();
      setIsLiked(data.isLiked);
      
      if (work) {
        setWork({
          ...work,
          likesCount: work.likesCount + (data.isLiked ? 1 : -1),
        });
      }

      toast.success(data.isLiked ? (t('liked') || 'Liked!') : (t('unliked') || 'Unliked'));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('likeError') || 'Failed to update like');
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm') || 'Are you sure you want to delete this work?')) {
      return;
    }

    try {
      const response = await fetch(`/api/works/${workId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete work');

      toast.success(t('deleteSuccess') || 'Work deleted successfully');
      router.push('/my-works');
    } catch (error) {
      console.error('Error deleting work:', error);
      toast.error(t('deleteError') || 'Failed to delete work');
    }
  };

  const handleSaveTitle = async () => {
    try {
      const response = await fetch(`/api/works/${workId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editTitle }),
      });

      if (!response.ok) throw new Error('Failed to update work');

      const updatedWork = await response.json();
      setWork(updatedWork);
      setIsEditing(false);
      toast.success(t('updateSuccess') || 'Work updated successfully');
    } catch (error) {
      console.error('Error updating work:', error);
      toast.error(t('updateError') || 'Failed to update work');
    }
  };

  const handleSaveDescription = async () => {
    try {
      const response = await fetch(`/api/works/${workId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: editDescription }),
      });

      if (!response.ok) throw new Error('Failed to update work');

      const updatedWork = await response.json();
      setWork(updatedWork);
      setIsEditingDesc(false);
      toast.success(t('updateSuccess') || 'Work updated successfully');
    } catch (error) {
      console.error('Error updating work:', error);
      toast.error(t('updateError') || 'Failed to update work');
    }
  };

  const handleTogglePublish = async () => {
    if (!work) return;

    try {
      const response = await fetch(`/api/works/${workId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !work.isPublished }),
      });

      if (!response.ok) throw new Error('Failed to update work');

      const updatedWork = await response.json();
      setWork(updatedWork);
      toast.success(
        updatedWork.isPublished
          ? t('publishSuccess') || 'Work published successfully'
          : t('unpublishSuccess') || 'Work unpublished successfully'
      );
    } catch (error) {
      console.error('Error updating work:', error);
      toast.error(t('updateError') || 'Failed to update work');
    }
  };

  const handleDownload = async () => {
    if (!work) return;

    try {
      const response = await fetch(work.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-${work.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('downloadSuccess') || 'Download started');
    } catch (error) {
      console.error('Error downloading work:', error);
      toast.error(t('downloadError') || 'Failed to download work');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t('notFound') || 'Work not found'}</p>
      </div>
    );
  }

  const isOwner = user?.id === work.userId;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {tCommon('back') || 'Back'}
      </Button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square">
              <Image
                src={work.imageUrl}
                alt={work.title || 'Work'}
                fill
                className="object-cover"
                priority
              />
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={t('titlePlaceholder') || 'Enter title...'}
                />
                <Button size="icon" onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(work.title || '');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                  {work.title || t('untitled') || 'Untitled Work'}
                </h1>
                {isOwner && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{work.viewsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className={isLiked ? 'h-4 w-4 fill-current text-red-500' : 'h-4 w-4'} />
              <span className="text-sm">{work.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{work.commentsCount || 0}</span>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{t('description') || 'Description'}</p>
                {isOwner && !isEditingDesc && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {isEditingDesc ? (
                <div>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={t('descriptionPlaceholder') || 'Enter description...'}
                    rows={4}
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      <Check className="mr-1 h-3 w-3" />
                      {tCommon('save') || 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingDesc(false);
                        setEditDescription(work.description || '');
                      }}
                    >
                      {tCommon('cancel') || 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {work.description || (isOwner ? (t('noDescription') || 'No description yet. Click edit to add one.') : (t('noDescription') || 'No description'))}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('createdAt') || 'Created'}
                </p>
                <p className="font-medium">
                  {new Date(work.createdAt).toLocaleDateString()}
                </p>
              </div>
              {work.templateId && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('template') || 'Template'}
                  </p>
                  <Link
                    href={`/template/${work.templateId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {t('viewTemplate') || 'View Template'}
                  </Link>
                </div>
              )}
              {work.promptUsed && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('prompt') || 'Prompt'}
                  </p>
                  <p className="text-sm">{work.promptUsed}</p>
                </div>
              )}
              {work.additionalPrompt && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('additionalPrompt') || 'Additional Prompt'}
                  </p>
                  <p className="text-sm">{work.additionalPrompt}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('status') || 'Status'}
                </p>
                <Badge variant={work.isPublished ? 'default' : 'secondary'}>
                  {work.isPublished
                    ? t('published') || 'Published'
                    : t('draft') || 'Draft'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={isLiked ? 'default' : 'outline'}
              onClick={handleToggleLike}
              className="flex-1"
            >
              <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? (t('liked') || 'Liked') : (t('like') || 'Like')}
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              {tCommon('download') || 'Download'}
            </Button>
            {!isOwner && (
              <Button
                variant="outline"
                onClick={() => setReportDialogOpen(true)}
              >
                <Flag className="mr-2 h-4 w-4" />
                {t('report') || 'Report'}
              </Button>
            )}
            {isOwner && (
              <>
                <Button
                  onClick={handleTogglePublish}
                  variant={work.isPublished ? 'outline' : 'default'}
                  className="flex-1"
                >
                  {work.isPublished
                    ? t('unpublish') || 'Unpublish'
                    : t('publish') || 'Publish'}
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tCommon('delete') || 'Delete'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-12">
        <WorkCommentsComponent workId={workId} />
      </div>

      {/* Report Dialog */}
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        targetType="work"
        targetId={workId}
      />
    </div>
  );
}
