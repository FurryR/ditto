'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Star, MoreHorizontal, Trash2, Flag } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  userId: string;
  content: string;
  rating?: number;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  user?: {
    id: string;
    githubUsername?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  replies?: Review[];
}

interface ReviewsComponentProps {
  templateId: string;
  reviews: Review[];
  onReviewsUpdate: () => void;
}

export function ReviewsComponent({ templateId, reviews, onReviewsUpdate }: ReviewsComponentProps) {
  const { user } = useUserStore();
  const t = useTranslations('reviews');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error(t('loginRequired'));
      return;
    }

    if (!content.trim()) {
      toast.error(t('contentRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/templates/${templateId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, rating }),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      toast.success(t('reviewSubmitted'));
      setContent('');
      setRating(5);
      onReviewsUpdate();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error(t('loginRequired'));
      return;
    }

    if (!replyContent.trim()) {
      toast.error(t('contentRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/templates/${templateId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (!response.ok) throw new Error('Failed to submit reply');

      toast.success(t('replySubmitted'));
      setReplyContent('');
      setReplyingTo(null);
      onReviewsUpdate();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error(t('submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (reviewId: string, isLiked: boolean) => {
    if (!user) {
      toast.error(t('loginRequired'));
      return;
    }

    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/reviews/${reviewId}/like`, { method });

      if (!response.ok) throw new Error('Failed to toggle like');

      onReviewsUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('likeError'));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      toast.error(t('loginRequired'));
      return;
    }

    if (!confirm(t('confirmDelete'))) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });

      if (!response.ok) throw new Error('Failed to delete review');

      toast.success(t('deleteSuccess'));
      onReviewsUpdate();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (!user) {
      toast.error(t('loginRequired'));
      return;
    }

    const reason = prompt(t('reportReasonPrompt'));
    if (!reason) return;

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'review',
          targetId: reviewId,
          reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to report review');

      toast.success(t('reportSuccess'));
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error(t('reportError'));
    }
  };

  const ReviewItem = ({ review, isReply = false }: { review: Review; isReply?: boolean }) => (
    <div className={`${isReply ? 'mt-4 ml-12' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={review.user?.avatarUrl} />
          <AvatarFallback>{review.user?.githubUsername?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {review.user?.displayName || review.user?.githubUsername}
            </span>
            {review.rating && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            )}
            <span className="text-muted-foreground text-sm">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{review.content}</p>
          <div className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1 p-0"
                onClick={() => handleToggleLike(review.id, review.isLiked)}
              >
                <Heart className={`h-4 w-4 ${review.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{review.likesCount}</span>
              </Button>
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 p-0"
                  onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{t('reply')}</span>
                </Button>
              )}
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user.id === review.userId && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('delete')}
                    </DropdownMenuItem>
                  )}
                  {user.id !== review.userId && (
                    <DropdownMenuItem onClick={() => handleReportReview(review.id)}>
                      <Flag className="mr-2 h-4 w-4" />
                      {t('report')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {replyingTo === review.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder={t('writeReply')}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(review.id)}
                  disabled={submitting}
                >
                  {t('submitReply')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {review.replies && review.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {review.replies.map((reply) => (
            <ReviewItem key={reply.id} review={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-xl font-semibold">{t('writeReview')}</h2>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t('rating')}:</span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i + 1)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 cursor-pointer transition-colors ${
                          i < rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder={t('writeYourReview')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSubmitReview} disabled={submitting}>
                {submitting ? t('submitting') : t('submitReview')}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">{t('loginToReview')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-xl font-semibold">
            {t('reviews')} ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">{t('noReviews')}</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
