import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ObserverLanding } from '@/components/observer/Landing';

interface LandingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'observer.landing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ObserverLandingPage() {
  return <ObserverLanding />;
}
