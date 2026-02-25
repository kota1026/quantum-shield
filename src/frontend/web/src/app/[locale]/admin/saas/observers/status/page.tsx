import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasObserverStatus } from '@/components/admin/saas/SaasObserverStatus';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasObserverStatus.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasObserverStatusPage() {
  return <SaasObserverStatus />;
}
