import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProverDashboard } from '@/components/prover/ProverDashboard';

interface ProverDashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProverDashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prover.dashboard.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ProverDashboardPage({
  params,
}: ProverDashboardPageProps) {
  return <ProverDashboard />;
}
