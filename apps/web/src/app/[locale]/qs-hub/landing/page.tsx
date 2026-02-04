import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QSHubLanding } from '@/components/qs-hub/QSHubLanding';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.landing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QSHubLandingPage() {
  return <QSHubLanding />;
}
