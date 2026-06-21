import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Dashboard } from '@/components/consumer/Dashboard';

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.dashboard.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  return <Dashboard />;
}
