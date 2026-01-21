import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnterpriseContract } from '@/components/enterprise/EnterpriseContract';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.contract.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseContractPage() {
  return <EnterpriseContract />;
}
