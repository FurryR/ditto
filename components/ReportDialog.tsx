'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ReportReason, ReportTargetType } from '@/types';
import { useUserStore } from '@/store/userStore';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetTitle,
}: ReportDialogProps) {
  const t = useTranslations('reportDialog');
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUserStore();

  const REPORT_REASONS: { value: ReportReason; label: string }[] = [
    { value: 'spam', label: t('reasons.spam') },
    { value: 'inappropriate', label: t('reasons.inappropriate') },
    { value: 'copyright', label: t('reasons.copyright') },
    { value: 'harassment', label: t('reasons.harassment') },
    { value: 'other', label: t('reasons.other') },
  ];

  const targetTypeLabel =
    targetType === 'template'
      ? t('targetTypes.template')
      : targetType === 'post'
        ? t('targetTypes.post')
        : targetType === 'review'
          ? t('targetTypes.review')
          : t('targetTypes.user');

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error(t('pleaseSignIn'));
      return;
    }

    if (!reason) {
      toast.error(t('pleaseSelectReason'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('submitFailed'));
      }

      toast.success(t('submitSuccess'));
      onOpenChange(false);
      setReason('spam');
      setDescription('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {targetTitle && t('reporting', { title: targetTitle })}
            <br />
            {t('tellUsWhatIsWrong', { targetType: targetTypeLabel })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t('reasonLabel')}</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('detailsLabel')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('detailsPlaceholder')}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
