import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExplorerLanding } from '@/components/explorer/Landing';

interface LandingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.landing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ExplorerLandingPage() {
  return <ExplorerLanding />;
}
