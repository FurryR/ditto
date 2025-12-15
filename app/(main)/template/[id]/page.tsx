'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UseTemplateDialog } from '@/components/UseTemplateDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { ReportDialog } from '@/components/ReportDialog';
import { ReviewsComponent } from '@/components/ReviewsComponent';
import { Heart, Share2, Eye, Sparkles, Flag, Download, Star, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateStats {
  viewsCount: number;
  likesCount: number;
  usesCount: number;
  reviewsCount?: number;
  averageRating?: number;
}

interface TemplateAuthor {
  id: string;
  githubUsername?: string;
  displayName?: string;
  avatarUrl?: string;
  followingCount?: number;
  followersCount?: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  baseImageUrl: string;
  characterImageUrls: string[];
  tags: string[];
  category: string;
  modelName: string;
  numCharacters: number;
  licenseType: string;
  isPublished: boolean;
  createdAt: string;
  authorId: string;
  author?: TemplateAuthor;
  stats?: TemplateStats;
}

interface UserWork {
  id: string;
  work_image_url: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('template');
  const { user } = useUserStore();
  
  const [template, setTemplate] = useState<any>(null);
  const [userWorks, setUserWorks] = useState<any[]>([]);
  const [relatedTemplates, setRelatedTemplates] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const templateId = params.id as string;

  useEffect(() => {
    if (templateId) {
      fetchTemplateData();
      fetchReviews();
      if (user) {
        checkLikeStatus();
        checkFollowStatus();
      }
    }
  }, [templateId, user]);

  const fetchTemplateData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      
      const data = await response.json();
      setTemplate(data.template);
      setUserWorks(data.userWorks || []);
      setRelatedTemplates(data.relatedTemplates || []);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error(t('fetchError'));
      router.push('/templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/templates/${templateId}/like`);
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !template) return;
    try {
      const response = await fetch(`/api/users/${template.authorId}/follow`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }

    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/templates/${templateId}/like`, { method });
      
      if (!response.ok) throw new Error('Failed to toggle like');
      
      setIsLiked(!isLiked);
      toast.success(isLiked ? t('unliked') : t('liked'));
      fetchTemplateData();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('likeError'));
    }
  };

  const handleFollow = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }
    if (!template) return;

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${template.authorId}/follow`, { method });
      
      if (!response.ok) throw new Error('Failed to toggle follow');
      
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? t('unfollowed') : t('followed'));
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(t('followError'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="w-full h-96" />
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-full h-24" />
          </div>
          <div className="space-y-4">
            <Skeleton className="w-full h-32" />
            <Skeleton className="w-full h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!template) return null;

  const stats = template.stats || { 
    viewsCount: 0, 
    likesCount: 0, 
    usesCount: 0, 
    reviewsCount: 0, 
    averageRating: 0 
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Image */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <Image
              src={template.baseImageUrl}
              alt={template.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Title and Actions */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{template.name}</h1>
              <div className="flex gap-2">
                <Button
                  variant={isLiked ? 'default' : 'outline'}
                  size="icon"
                  onClick={handleLike}
                >
                  <Heart className={isLiked ? 'fill-current' : ''} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setShareDialogOpen(true)}>
                  <Share2 />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setReportDialogOpen(true)}>
                  <Flag />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm text-muted-foreground">
              {stats.averageRating && stats.averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{stats.averageRating.toFixed(1)} ({stats.reviewsCount || 0})</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{stats.viewsCount} {t('views')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{stats.likesCount} {t('likes')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>{stats.usesCount} {t('uses')}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{template.category}</Badge>
              <Badge variant="outline">{template.modelName}</Badge>
              {template.tags.map((tag: string) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">{t('description')}</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{template.description}</p>
            </CardContent>
          </Card>

          {/* Character Images */}
          {template.characterImageUrls && template.characterImageUrls.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">{t('characterImages')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {template.characterImageUrls.map((url: string, index: number) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={url}
                        alt={`Character ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Template - Hidden for privacy */}

          {/* User Works - Masonry Layout */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">{t('createdWith')}</h2>
              {userWorks.length > 0 ? (
                <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                  {userWorks.map((work) => (
                    <div 
                      key={work.id} 
                      className="break-inside-avoid mb-4 cursor-pointer group"
                      onClick={() => router.push(`/works/${work.id}`)}
                    >
                      <div className="space-y-2">
                        <div className="relative w-full rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={work.imageUrl}
                            alt={work.title || "User work"}
                            width={400}
                            height={400}
                            className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Stats overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <div className="flex items-center gap-3 text-white text-xs">
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
                          </div>
                        </div>
                        {work.user && (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={work.user.avatar} />
                                <AvatarFallback>{work.user.githubUsername?.[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                @{work.user.githubUsername}
                              </span>
                            </div>
                            {work.title && (
                              <span className="text-xs text-muted-foreground truncate">
                                {work.title}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  {t('noWorks')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Use Template Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => setUseDialogOpen(true)}
            disabled={!user}
          >
            <Sparkles className="mr-2" />
            {t('useTemplate')}
          </Button>

          {/* Author Card */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/profile/${template.author?.githubUsername}`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={template.author?.avatarUrl} />
                  <AvatarFallback>{template.author?.githubUsername?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {template.author?.displayName || template.author?.githubUsername}
                  </h3>
                  {template.author?.displayName && (
                    <p className="text-sm text-muted-foreground">@{template.author?.githubUsername}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                    <span>{template.author?.followingCount || 0} {t('following')}</span>
                    <span>{template.author?.followersCount || 0} {t('followers')}</span>
                  </div>
                </div>
                {user && user.id !== template.authorId && (
                  <Button
                    variant={isFollowing ? 'secondary' : 'default'}
                    size="icon"
                    className="rounded-full h-8 w-8 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow();
                    }}
                  >
                    {isFollowing ? '✓' : '+'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">{t('details')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('model')}:</span>
                  <span>{template.modelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('characters')}:</span>
                  <span>{template.numCharacters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('license')}:</span>
                  <span>{template.licenseType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('created')}:</span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <ReviewsComponent
            templateId={templateId}
            reviews={reviews}
            onReviewsUpdate={fetchReviews}
          />

          {/* Related Templates */}
          {relatedTemplates.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">{t('relatedTemplates')}</h3>
                <div className="space-y-4">
                  {relatedTemplates.slice(0, 3).map((related) => (
                    <div
                      key={related.id}
                      className="group cursor-pointer"
                      onClick={() => router.push(`/template/${related.id}`)}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                        <Image
                          src={related.base_image_url}
                          alt={related.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-medium text-sm line-clamp-1">{related.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        @{related.profiles.username}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <UseTemplateDialog
        open={useDialogOpen}
        onOpenChange={setUseDialogOpen}
        template={template}
      />
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={template.name}
      />
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        targetType="template"
        targetId={template.id}
        targetTitle={template.name}
      />
    </div>
  );
}
