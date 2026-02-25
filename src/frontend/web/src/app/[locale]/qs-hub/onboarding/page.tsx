import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QSHubOnboarding } from '@/components/qs-hub/Onboarding';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.onboarding.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QSHubOnboardingPage() {
  return <QSHubOnboarding />;
}
