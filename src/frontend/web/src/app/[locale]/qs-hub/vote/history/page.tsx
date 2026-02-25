import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { VoteHistory } from '@/components/qs-hub/VoteHistory';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.vote.history.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function VoteHistoryPage() {
  return <VoteHistory />;
}
