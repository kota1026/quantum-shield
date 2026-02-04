import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubLanding } from '@/components/token-hub/Landing';

interface LandingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.landing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubLandingPage({ params }: LandingPageProps) {
  return <TokenHubLanding />;
}
