'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useUserStore } from '@/store/userStore';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WorkComment {
  id: string;
  workId: string;
  userId: string;
  content: string;
  parentId: string | null;
  likesCount: number;
  createdAt: string;
  user?: {
    id: string;
    githubUsername?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  replies?: WorkComment[];
}

interface WorkCommentsComponentProps {
  workId: string;
}

export function WorkCommentsComponent({ workId }: WorkCommentsComponentProps) {
  const { user } = useUserStore();
  const t = useTranslations('workComments');
  const tCommon = useTranslations('common');

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Use SWR to fetch comments
  const { data: commentsData, error, mutate } = useSWR(`/api/works/${workId}/comments`, fetcher);

  const loading = !commentsData && !error;
  const comments: WorkComment[] = commentsData?.comments || [];

  useEffect(() => {
    if (error) {
      console.error('Error fetching comments:', error);
    }
  }, [error]);

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error(t('loginToComment') || 'Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/works/${workId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      mutate(); // Revalidate comments
      setNewComment('');
      toast.success(t('commentPosted') || 'Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(t('commentError') || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error(t('loginToComment') || 'Please sign in to comment');
      return;
    }

    if (!replyContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/works/${workId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (!response.ok) throw new Error('Failed to post reply');

      mutate(); // Revalidate comments
      setReplyContent('');
      setReplyTo(null);
      toast.success(t('replyPosted') || 'Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error(t('replyError') || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: WorkComment;
    isReply?: boolean;
  }) => (
    <div className={`flex gap-3 ${isReply ? 'mt-3 ml-12' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user?.avatarUrl} />
        <AvatarFallback>
          {comment.user?.displayName?.[0] || comment.user?.githubUsername?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {comment.user?.displayName || comment.user?.githubUsername || 'Anonymous'}
          </span>
          <span className="text-muted-foreground text-xs">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="mt-1 text-sm">{comment.content}</p>
        <div className="mt-2 flex items-center gap-4">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled>
            <Heart className="mr-1 h-3 w-3" />
            {comment.likesCount || 0}
          </Button>
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setReplyTo(comment.id)}
            >
              <MessageCircle className="mr-1 h-3 w-3" />
              {t('reply') || 'Reply'}
            </Button>
          )}
        </div>
        {replyTo === comment.id && (
          <div className="mt-3">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={t('writeReply') || 'Write a reply...'}
              className="mb-2"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={submitting || !replyContent.trim()}
              >
                {submitting ? t('posting') || 'Posting...' : t('postReply') || 'Post Reply'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent('');
                }}
              >
                {tCommon('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {t('comments') || 'Comments'} ({comments.length})
      </h2>

      {user && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name?.[0] || user.githubUsername?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('writeComment') || 'Write a comment...'}
                  className="mb-3"
                  rows={3}
                />
                <Button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()}>
                  {submitting ? t('posting') || 'Posting...' : t('postComment') || 'Post Comment'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-muted-foreground text-center">
          {t('loading') || 'Loading comments...'}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          {t('noComments') || 'No comments yet. Be the first to comment!'}
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
