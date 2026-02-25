import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { History } from '@/components/consumer/History';

interface HistoryPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: HistoryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.history.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  return <History />;
}
