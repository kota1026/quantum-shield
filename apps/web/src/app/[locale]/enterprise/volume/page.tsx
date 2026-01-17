import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { VolumeDashboard } from '@/components/enterprise/Volume';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.volume.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseVolumePage() {
  return <VolumeDashboard />;
}
