import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnterpriseMonitoring } from '@/components/enterprise/Monitoring';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.monitoring.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function MonitoringPage() {
  return <EnterpriseMonitoring />;
}
