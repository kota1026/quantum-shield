import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasInfrastructure } from '@/components/admin/saas/SaasInfrastructure';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasInfrastructure.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasInfrastructurePage() {
  return <SaasInfrastructure />;
}
