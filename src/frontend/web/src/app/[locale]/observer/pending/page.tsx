import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PendingMonitor } from '@/components/observer/Pending';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'observer.dashboard.pending.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PendingMonitorPage() {
  return <PendingMonitor />;
}
