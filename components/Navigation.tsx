'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserStore } from '@/store/userStore';
import { useLocale } from '@/components/LocaleProvider';
import { Globe, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const t = useTranslations('common');
  const tNav = useTranslations('navigation');
  const { user } = useUserStore();
  const { locale, setLocale } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: t('home'), href: '/' },
    { name: t('templates'), href: '/templates' },
    { name: t('studio'), href: '/studio' },
  ];

  const handleLanguageChange = (nextLocale: string) => {
    if (nextLocale === locale) return;
    if (nextLocale === 'en' || nextLocale === 'zh' || nextLocale === 'ja') {
      setLocale(nextLocale as 'en' | 'zh' | 'ja');
    }
  };

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-primary text-2xl font-bold">🎭</div>
              <span className="text-xl font-bold">{t('appName')}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                  {tNav('languageEnglish')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('zh')}>
                  {tNav('languageChineseSimplified')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('ja')}>
                  {tNav('languageJapanese')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name || ''} />
                      <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">{t('profile')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">{t('settings')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <form action="/api/auth/signout" method="POST" className="w-full">
                      <button type="submit" className="w-full text-left">
                        {t('signOut')}
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/signin">{t('signIn')}</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:bg-accent hover:text-accent-foreground block rounded-md px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="border-t pt-4 pb-3">
            <div className="flex items-center space-x-3 px-5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Globe className="mr-2 h-4 w-4" />
                    {t('profile')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                    {tNav('languageEnglish')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange('zh')}>
                    {tNav('languageChineseSimplified')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange('ja')}>
                    {tNav('languageJapanese')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {user ? (
              <div className="mt-3 space-y-1 px-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile">{t('profile')}</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/settings">{t('settings')}</Link>
                </Button>
                <form action="/api/auth/signout" method="POST">
                  <Button variant="ghost" type="submit" className="w-full">
                    {t('signOut')}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="mt-3 px-2">
                <Button className="w-full" asChild>
                  <Link href="/signin">{t('signIn')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
