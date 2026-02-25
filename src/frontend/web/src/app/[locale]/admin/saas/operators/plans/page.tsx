import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasOperatorPlans } from '@/components/admin/saas/SaasOperatorPlans';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.operatorPlans.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasOperatorPlansPage() {
  return <SaasOperatorPlans />;
}
