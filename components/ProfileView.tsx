'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Globe, Github, Twitter, Mail, Send, MessageCircle, Upload, Camera, Heart, Eye } from 'lucide-react';

export type ProfileRow = {
  id: string;
  githubUsername?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  bio?: string | null;
  socialLinks?: Record<string, any> | null;
  followingCount?: number;
  followersCount?: number;
};

type TemplatePreview = {
  id: string;
  name: string;
  coverImageUrl?: string | null;
  baseImageUrl: string;
  isPublished?: boolean | null;
};

type WorkPreview = {
  id: string;
  imageUrl: string;
  title?: string | null;
  isPublished?: boolean | null;
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
};

const CONTACT_ORDER = ['website', 'github', 'twitter', 'email', 'telegram', 'discord', 'bilibili', 'weibo'] as const;

export function ProfileView({
  profile,
  templates,
  works,
  editable,
  onEdit,
  showSettings,
  onBannerUpload,
  onUpdateProfile,
}: {
  profile: ProfileRow;
  templates: TemplatePreview[];
  works: WorkPreview[];
  editable: boolean;
  onEdit?: () => void;
  showSettings?: boolean;
  onBannerUpload?: (file: File) => Promise<void>;
  onUpdateProfile?: (updates: Partial<ProfileRow>) => Promise<void>;
}) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const social = (profile.socialLinks || {}) as Record<string, string>;
  const bannerUrl = (social.banner || '') as string;
  const displayName = profile.displayName || profile.githubUsername || tCommon('user');

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);
  const [bioValue, setBioValue] = useState(profile.bio || '');
  const [uploading, setUploading] = useState(false);

  const handleBannerClick = () => {
    if (!editable) return;
    bannerInputRef.current?.click();
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onBannerUpload) return;

    setUploading(true);
    try {
      await onBannerUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const handleNameBlur = async () => {
    setEditingName(false);
    if (nameValue !== displayName && onUpdateProfile) {
      await onUpdateProfile({ displayName: nameValue });
    }
  };

  const handleBioBlur = async () => {
    setEditingBio(false);
    if (bioValue !== (profile.bio || '') && onUpdateProfile) {
      await onUpdateProfile({ bio: bioValue });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden p-0">
        <div
          className={
            'relative h-40 w-full bg-muted group ' +
            (editable ? 'cursor-pointer' : '')
          }
          onClick={editable ? handleBannerClick : undefined}
        >
          {bannerUrl ? (
            <Image src={bannerUrl} alt={t('banner')} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900" />
          )}
          
          {editable && (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <div className="text-white">{t('uploading')}</div>
                  ) : (
                    <div className="flex items-center gap-2 text-white">
                      <Camera className="h-5 w-5" />
                      <span>{t('changeBanner')}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {showSettings && (
            <div 
              className="absolute right-4 top-4 z-10" 
              onClick={(e) => e.stopPropagation()}
            >
              <Button asChild variant="outline" size="icon" aria-label={t('settings')}>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="px-6 pb-4">
          <div className="flex items-start gap-6">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted border-4 border-white -mt-10">
              <Image
                src={profile.avatarUrl || '/default-avatar.jpg'}
                alt={displayName}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingName && editable ? (
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onBlur={handleNameBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameBlur();
                        if (e.key === 'Escape') {
                          setNameValue(displayName);
                          setEditingName(false);
                        }
                      }}
                      autoFocus
                      className="text-2xl font-bold h-auto py-1 px-2"
                    />
                  ) : (
                    <div
                      className={(editable ? 'cursor-pointer hover:text-muted-foreground transition-colors ' : '') + 'text-2xl font-bold'}
                      onClick={() => editable && setEditingName(true)}
                    >
                      {displayName}
                    </div>
                  )}
                  {profile.githubUsername && (
                    <div className="text-sm text-muted-foreground">@{profile.githubUsername}</div>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{profile.followingCount || 0} {t('following')}</span>
                    <span>{profile.followersCount || 0} {t('followers')}</span>
                  </div>
                </div>
              </div>

              {editingBio && editable ? (
                <Textarea
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                  onBlur={handleBioBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setBioValue(profile.bio || '');
                      setEditingBio(false);
                    }
                  }}
                  autoFocus
                  className="text-sm text-muted-foreground min-h-20"
                  placeholder={t('bioEmpty')}
                />
              ) : (
                <div
                  className={
                    'text-sm text-muted-foreground whitespace-pre-wrap break-words ' +
                    (editable ? 'cursor-pointer hover:opacity-70 transition-opacity' : '')
                  }
                  onClick={() => editable && setEditingBio(true)}
                >
                  {profile.bio || t('bioEmpty')}
                </div>
              )}

              {(() => {
                const githubUsername = profile.githubUsername;
                const otherLinks = CONTACT_ORDER.filter((k) => k !== 'github' && social[k]);
                const hasAnyLinks = githubUsername || otherLinks.length > 0;

                if (!hasAnyLinks) {
                  return (
                    <div className="text-sm text-muted-foreground">
                      {t('contactsEmpty')}
                    </div>
                  );
                }

                const getIcon = (platform: string) => {
                  switch(platform) {
                    case 'website': return <Globe className="h-5 w-5" />;
                    case 'github': return <Github className="h-5 w-5" />;
                    case 'twitter': return <Twitter className="h-5 w-5" />;
                    case 'email': return <Mail className="h-5 w-5" />;
                    case 'telegram': return <Send className="h-5 w-5" />;
                    case 'discord': return <MessageCircle className="h-5 w-5" />;
                    default: return <Globe className="h-5 w-5" />;
                  }
                };

                return (
                  <div className="flex flex-wrap gap-3">
                    {/* Always show GitHub as first icon if username exists */}
                    {githubUsername && (
                      <a
                        href={`https://github.com/${githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                          title="GitHub"
                        >
                          <Github className="h-5 w-5" />
                        </button>
                      </a>
                    )}

                    {/* Other social links */}
                    {otherLinks.map((k) => {
                      const value = String(social[k] || '');
                      const isUrl = /^https?:\/\//i.test(value);
                      const iconButton = (
                        <button
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                          title={t(`social.${k}`)}
                        >
                          {getIcon(k)}
                        </button>
                      );
                      return isUrl ? (
                        <a key={k} href={value} target="_blank" rel="noopener noreferrer">
                          {iconButton}
                        </a>
                      ) : (
                        <div key={k}>
                          {iconButton}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-10">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('templatesSection')}</h2>
            {editable ? (
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link href="/studio">{t('create')}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile/templates">{t('viewAll')}</Link>
                </Button>
              </div>
            ) : null}
          </div>

          {templates.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">{t('templatesEmpty')}</div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {templates.map((tpl) => (
                <div key={tpl.id} className="mb-4 break-inside-avoid">
                  <Link href={`/template/${tpl.id}`}>
                    <Card className="group overflow-hidden">
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        <Image
                          src={tpl.coverImageUrl || tpl.baseImageUrl}
                          alt={tpl.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="p-3">
                        <div className="line-clamp-1 font-semibold">{tpl.name}</div>
                      </div>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('worksSection')}</h2>
            {editable ? (
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link href="/templates">{t('create')}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/my-works">{t('viewAll')}</Link>
                </Button>
              </div>
            ) : null}
          </div>

          {works.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">{t('worksEmpty')}</div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {works.map((work) => (
                <div key={work.id} className="mb-4 break-inside-avoid">
                  <Link href={`/works/${work.id}`}>
                    <Card className="group overflow-hidden cursor-pointer">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <Image
                          src={work.imageUrl}
                          alt={work.title || tCommon('work')}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        {/* Stats overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
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
                      {work.title && (
                        <div className="p-3">
                          <div className="line-clamp-1 text-sm font-medium">{work.title}</div>
                        </div>
                      )}
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
