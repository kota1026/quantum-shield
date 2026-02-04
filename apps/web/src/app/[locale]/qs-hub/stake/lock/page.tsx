import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StakeLock } from '@/components/qs-hub/StakeLock';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.stake.lock.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QSHubStakeLockPage() {
  return <StakeLock />;
}
