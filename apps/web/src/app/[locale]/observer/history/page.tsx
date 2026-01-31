import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChallengeHistory } from '@/components/observer/History';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'observer.dashboard.history.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HistoryPage() {
  return <ChallengeHistory />;
}
