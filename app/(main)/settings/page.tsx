'use client';

import { useEffect, useState, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Globe, Github, Twitter, Mail, Send, MessageCircle, Trash2, Plus, ExternalLink, Link as LinkIcon } from 'lucide-react';

type SocialLink = {
  id: string;
  platform: string;
  url: string;
};

function SettingsPageContent() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [openRouterConnected, setOpenRouterConnected] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();

        if (data) {
          const links = data.socialLinks || {};
          const linkArray: SocialLink[] = [];
          
          Object.entries(links).forEach(([key, value]) => {
            if (key !== 'banner' && key !== 'github' && value) {
              linkArray.push({
                id: key,
                platform: key,
                url: String(value),
              });
            }
          });

          // Sort by platform
          linkArray.sort((a, b) => a.platform.localeCompare(b.platform));
          setSocialLinks(linkArray);

          // Check if OpenRouter is connected
          const apiSettings = data.apiSettings || {};
          setOpenRouterConnected(!!apiSettings.openrouter_key);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error(t('loadFailed'));
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user?.id, t]);

  useEffect(() => {
    // Check for OAuth success/error
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'true') {
      toast.success(t('openRouterConnected'));
      setOpenRouterConnected(true);
      // Clean URL
      router.replace('/settings');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        no_code: t('openRouterErrorNoCode'),
        no_verifier: t('openRouterErrorNoVerifier'),
        auth_failed: t('openRouterErrorAuthFailed'),
        no_key: t('openRouterErrorNoKey'),
        profile_not_found: t('openRouterErrorProfileNotFound'),
        internal_error: t('openRouterErrorInternal'),
      };
      toast.error(errorMessages[error] || t('openRouterErrorUnknown'));
      // Clean URL
      router.replace('/settings');
    }
  }, [searchParams, router, t]);

  const detectPlatform = (url: string): string => {
    const normalized = url.toLowerCase();
    if (normalized.includes('github.com')) return 'github';
    if (normalized.includes('twitter.com') || normalized.includes('x.com')) return 'twitter';
    if (normalized.includes('t.me') || normalized.includes('telegram')) return 'telegram';
    if (normalized.includes('discord')) return 'discord';
    if (normalized.includes('bilibili.com')) return 'bilibili';
    if (normalized.includes('weibo.com')) return 'weibo';
    if (normalized.includes('mailto:')) return 'email';
    return 'website';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'github': return <Github className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'telegram': return <Send className="h-4 w-4" />;
      case 'discord': return <MessageCircle className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const handleAddLink = async () => {
    if (!newLinkUrl.trim()) {
      toast.error(t('pleaseEnterUrl'));
      return;
    }

    if (!user?.id) return;

    const platform = detectPlatform(newLinkUrl);
    
    // Check if platform already exists
    if (socialLinks.some(link => link.platform === platform)) {
      toast.error(t('platformExists'));
      return;
    }

    const updatedLinks = [...socialLinks, { id: platform, platform, url: newLinkUrl }];
    const socialLinksObj: Record<string, string> = {};
    
    updatedLinks.forEach(link => {
      socialLinksObj[link.platform] = link.url;
    });

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_links: socialLinksObj }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setSocialLinks(updatedLinks.sort((a, b) => a.platform.localeCompare(b.platform)));
      setNewLinkUrl('');
      toast.success(t('linkAdded'));
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error(t('updateFailed'));
    }
  };

  const handleRemoveLink = async (platform: string) => {
    if (!user?.id) return;

    const updatedLinks = socialLinks.filter(link => link.platform !== platform);
    const socialLinksObj: Record<string, string> = {};
    
    updatedLinks.forEach(link => {
      socialLinksObj[link.platform] = link.url;
    });

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialLinks: socialLinksObj }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setSocialLinks(updatedLinks);
      toast.success(t('linkRemoved'));
    } catch (error) {
      console.error('Error removing link:', error);
      toast.error(t('updateFailed'));
    }
  };

  // Generate code verifier and challenge for PKCE
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    // Convert to base64url format
    const hashArray = Array.from(new Uint8Array(hash));
    const base64 = btoa(String.fromCharCode(...hashArray));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const handleConnectOpenRouter = async () => {
    if (!user?.id) return;

    try {
      // Generate code verifier
      const codeVerifier = generateCodeVerifier();
      
      // Generate code challenge
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store code verifier in cookie with secure settings
      document.cookie = `openrouter_code_verifier=${codeVerifier}; path=/; max-age=600; SameSite=Lax; Secure`;
      
      // Get current URL for callback
      const callbackUrl = `${window.location.origin}/openrouter/callback?redirect=/settings`;
      
      // Redirect to OpenRouter auth with PKCE
      const authUrl = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to OpenRouter:', error);
      toast.error(t('openRouterConnectFailed'));
    }
  };

  const handleDisconnectOpenRouter = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiSettings: { openrouter_key: null } 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect OpenRouter');
      }

      setOpenRouterConnected(false);
      toast.success(t('openRouterDisconnected'));
    } catch (error) {
      console.error('Error disconnecting OpenRouter:', error);
      toast.error(t('updateFailed'));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error(t('confirmDeleteText'));
      return;
    }

    // TODO: Implement account deletion logic
    toast.info(t('deleteRequestSubmitted'));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t('pleaseSignIn')}</p>
        <Link href="/signin" className="mt-4 inline-block text-primary hover:underline">
          {tCommon('signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>

        {/* Social Links Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t('socialLinks')}</h2>
            <p className="text-sm text-muted-foreground">{t('socialLinksDescription')}</p>
          </div>

          <div className="space-y-3">
            {socialLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getPlatformIcon(link.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium capitalize">{link.platform}</div>
                  <div className="text-sm text-muted-foreground truncate">{link.url}</div>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLink(link.platform)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              type="url"
              placeholder={t('enterUrl')}
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddLink();
              }}
            />
            <Button onClick={handleAddLink}>
              <Plus className="mr-2 h-4 w-4" />
              {t('add')}
            </Button>
          </div>
        </section>

        {/* API Settings Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t('apiSettings')}</h2>
            <p className="text-sm text-muted-foreground">{t('apiSettingsDescription')}</p>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <LinkIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">OpenRouter</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('openRouterDescription')}
                  </p>
                  <a 
                    href="https://openrouter.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    {t('learnMore')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="border-t pt-4">
                {openRouterConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">{t('openRouterConnectedStatus')}</span>
                    </div>
                    <Button variant="outline" onClick={handleDisconnectOpenRouter}>
                      {t('disconnectOpenRouter')}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleConnectOpenRouter}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {t('connectOpenRouter')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Danger Zone Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-destructive">{t('dangerZone')}</h2>
            <p className="text-sm text-muted-foreground">{t('dangerZoneDescription')}</p>
          </div>

          <Card className="border-destructive p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{t('deleteAccount')}</h3>
                <p className="text-sm text-muted-foreground">{t('deleteAccountWarning')}</p>
              </div>
              <div>
                <Label htmlFor="delete-confirm">{t('deleteConfirmLabel')}</Label>
                <Input
                  id="delete-confirm"
                  placeholder="DELETE"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                {t('submitDeleteRequest')}
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
