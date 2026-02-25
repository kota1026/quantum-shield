import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubDashboard } from '@/components/token-hub/Dashboard';

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.dashboard.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubDashboardPage({ params }: DashboardPageProps) {
  return <TokenHubDashboard />;
}
