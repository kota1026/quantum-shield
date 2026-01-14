import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Header, Footer, CookieBanner } from '@/components/layout';
import { Landing } from '@/components/consumer/Landing';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ConsumerLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const skipText = locale === 'ja' ? 'メインコンテンツにスキップ' : 'Skip to main content';

  return (
    <>
      {/* Skip to Main Content Link - A11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-hinomaru focus:text-white focus:rounded-qs focus:outline-none"
      >
        {skipText}
      </a>
      <Header />
      <main id="main-content" role="main" tabIndex={-1}>
        <Landing />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
