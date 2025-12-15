import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AIProviderBanner } from '@/components/AIProviderBanner';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <AIProviderBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
