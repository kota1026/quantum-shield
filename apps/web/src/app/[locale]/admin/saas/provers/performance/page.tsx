import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasProverPerformance } from '@/components/admin/saas/SaasProverPerformance';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasProverPerformance.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasProverPerformancePage() {
  return <SaasProverPerformance />;
}
