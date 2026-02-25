import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasInfrastructureSla } from '@/components/admin/saas/SaasInfrastructureSla';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasInfraSla.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasInfrastructureSlaPage() {
  return <SaasInfrastructureSla />;
}
