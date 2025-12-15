'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type EditableProfile = {
  displayName?: string | null;
  bio?: string | null;
  socialLinks?: Record<string, string> | null;
};

const SOCIAL_FIELDS: Array<{ key: string; type?: string }> = [
  { key: 'github', type: 'url' },
  { key: 'twitter', type: 'url' },
  { key: 'website', type: 'url' },
  { key: 'email', type: 'email' },
  { key: 'telegram' },
  { key: 'discord' },
  { key: 'bilibili', type: 'url' },
  { key: 'weibo', type: 'url' },
];

export function ProfileEditDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EditableProfile;
  onSave: (next: EditableProfile) => Promise<void> | void;
  saving?: boolean;
}) {
  const t = useTranslations('profile');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [banner, setBanner] = useState('');
  const [links, setLinks] = useState<Record<string, string>>({});

  const initialKey = useMemo(() => JSON.stringify(initial || {}), [initial]);

  useEffect(() => {
    const social = (initial.socialLinks || {}) as Record<string, string>;
    setDisplayName(initial.displayName || '');
    setBio(initial.bio || '');
    setBanner(social.banner || '');

    const nextLinks: Record<string, string> = {};
    for (const { key } of SOCIAL_FIELDS) nextLinks[key] = social[key] || '';
    setLinks(nextLinks);
  }, [initialKey]);

  const handleSave = async () => {
    const socialLinks: Record<string, string> = {
      ...(initial.socialLinks || {}),
      banner: banner.trim(),
    };

    for (const { key } of SOCIAL_FIELDS) {
      const val = (links[key] || '').trim();
      if (val) socialLinks[key] = val;
      else delete socialLinks[key];
    }

    await onSave({
      displayName: displayName.trim(),
      bio: bio.trim(),
      socialLinks,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('editProfile')}</DialogTitle>
          <DialogDescription>{t('editProfileDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayName')}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner">{t('banner')}</Label>
            <Input
              id="banner"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder={t('bannerUrlPlaceholder')}
              inputMode="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t('bio')}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('bioPlaceholder')}
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <div className="font-semibold">{t('contacts')}</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SOCIAL_FIELDS.map(({ key, type }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`social-${key}`}>{t(`social.${key}`)}</Label>
                  <Input
                    id={`social-${key}`}
                    type={type || 'text'}
                    value={links[key] || ''}
                    onChange={(e) => setLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={t('contactPlaceholder')}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
