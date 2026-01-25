import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QSHubRewards } from '@/components/qs-hub/Rewards';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.rewards.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QSHubRewardsPage() {
  return <QSHubRewards />;
}
