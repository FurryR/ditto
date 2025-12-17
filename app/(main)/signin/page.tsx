'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

export default function SignInPage() {
  const t = useTranslations('common');
  const tSignIn = useTranslations('signin');
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGitHubSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">{t('signIn')}</h1>
          <p className="text-muted-foreground mb-8">{tSignIn('signInWithGitHub')}</p>
          <Button onClick={handleGitHubSignIn} size="lg" className="w-full">
            {t('signInWithGitHub')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
