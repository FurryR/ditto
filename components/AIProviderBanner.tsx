'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useUserStore } from '@/store/userStore';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AIProviderBanner() {
  const t = useTranslations('aiProviderBanner');
  const router = useRouter();
  const { user } = useUserStore();
  const [isVisible, setIsVisible] = useState(false);

  // Use SWR to fetch settings
  const { data: settingsData, isLoading } = useSWR(user?.id ? '/api/settings' : null, fetcher);

  const isConnected = !!settingsData?.apiSettings?.openrouter_key;

  useEffect(() => {
    if (!user?.id) {
      setIsVisible(false);
      return;
    }

    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('ai_provider_banner_dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
      return;
    }

    // Show banner if not connected and data is loaded
    if (!isLoading && settingsData) {
      setIsVisible(!isConnected);
    }
  }, [user?.id, isLoading, settingsData, isConnected]);

  const handleClose = () => {
    localStorage.setItem('ai_provider_banner_dismissed', 'true');
    setIsVisible(false);
  };

  const handleClick = () => {
    router.push('/settings');
  };

  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <div className="border-b border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <button
            onClick={handleClick}
            className="flex flex-1 items-start gap-3 text-left transition-opacity hover:opacity-80"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">{t('title')}</p>
              <p className="mt-0.5 text-sm text-yellow-700 dark:text-yellow-300">
                {t('description')}
              </p>
            </div>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 shrink-0 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-900 dark:hover:text-yellow-200"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t('close')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
