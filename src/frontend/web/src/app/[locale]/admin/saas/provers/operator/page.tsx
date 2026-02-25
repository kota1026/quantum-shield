import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasProverOperator } from '@/components/admin/saas/SaasProverOperator';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasProverOperator.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasProverOperatorPage() {
  return <SaasProverOperator />;
}
