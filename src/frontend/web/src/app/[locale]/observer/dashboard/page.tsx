import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ObserverDashboard } from '@/components/observer/Dashboard';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'observer.dashboard.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ObserverDashboardPage() {
  return <ObserverDashboard />;
}
