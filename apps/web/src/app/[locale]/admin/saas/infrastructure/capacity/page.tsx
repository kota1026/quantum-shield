import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasInfrastructureCapacity } from '@/components/admin/saas/SaasInfrastructureCapacity';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasInfrastructureCapacity.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasInfrastructureCapacityPage() {
  return <SaasInfrastructureCapacity />;
}
