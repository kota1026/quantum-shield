import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicProtocolContracts } from '@/components/admin/public/PublicProtocolContracts';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.protocolContracts.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PublicProtocolContractsPage() {
  return <PublicProtocolContracts />;
}
