import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasProverSla } from '@/components/admin/saas/SaasProverSla';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasProverSla.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasProverSlaPage() {
  return <SaasProverSla />;
}
